import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONSENT_VERSION, CONTACT_CONSENT_TEXT } from "@/lib/texas/brand";
import { getTrade } from "@/lib/texas/trades";

// Inbound leads from the website — somebody who came to us rather than
// somebody we bought.
//
// The difference matters more than it looks. A purchased row carries no
// consent to anything; a person who filled in this form and saw the consent
// sentence may lawfully be called and texted, and that permission is worth
// real money. So the sentence is stored verbatim with the row, along with when
// they saw it, where, and from what address.
//
// The consent text is taken from the server's own constant rather than from
// the request body. A client that could post its own consent wording could
// post "I agree to nothing" and have it filed as though it were our disclosure.

const MAX = { name: 120, phone: 32, address: 200, notes: 2000 };

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Digits to E.164, so the unique key matches whatever a bought list produces. */
function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const customerName = clean(body.customerName, MAX.name);
  const rawPhone = clean(body.customerPhone, MAX.phone);
  const address = clean(body.address, MAX.address);

  if (!customerName) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  const phoneKey = toE164(rawPhone);
  if (!phoneKey) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: "We need the address to inspect." }, { status: 400 });
  }

  // Consent is a deliberate act. An unticked box is a lead we may work, not a
  // number we may dial, so we record the absence rather than inventing one.
  const consented = body.consent === true;

  const trade = typeof body.trade === "string" && getTrade(body.trade) ? body.trade : null;
  const jobKind = body.jobKind === "INSURANCE" ? "INSURANCE" : "RETAIL";

  // Behind a proxy the client address is the first hop in the forwarded list.
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || null;

  const consentFields = consented
    ? {
        consentText: CONTACT_CONSENT_TEXT,
        consentVersion: CONSENT_VERSION,
        consentAt: new Date(),
        consentIp: ip,
        consentUrl: clean(body.pageUrl, MAX.address) || req.headers.get("referer"),
      }
    : {};

  const lead = await prisma.lead.upsert({
    // The same homeowner filling the form twice is one lead with one history,
    // matching how purchased rows are deduplicated.
    where: { phoneKey },
    create: {
      customerName,
      customerPhone: rawPhone,
      customerEmail: clean(body.customerEmail, MAX.name) || null,
      address,
      city: clean(body.city, MAX.name) || null,
      zip: clean(body.zip, 10) || null,
      phoneKey,
      trade,
      jobKind,
      source: clean(body.source, 40) || "website",
      notes: clean(body.notes, MAX.notes) || null,
      // Inbound leads never needed scrubbing to be called — they asked us to.
      // The timestamp records that this was answered, not that a registry was
      // consulted, and screenLead treats a consented lead accordingly.
      scrubbedAt: consented ? new Date() : null,
      ...consentFields,
    },
    // A second submission updates what they told us without resetting the
    // call history or overwriting a consent record with a blank one.
    update: {
      customerName,
      address,
      ...(trade ? { trade } : {}),
      ...consentFields,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
