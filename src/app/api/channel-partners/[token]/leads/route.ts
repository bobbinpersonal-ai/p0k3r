import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorisePartnerToken } from "@/lib/partnerAuth";
import { getService } from "@/lib/regions/channelPartners";
import { notifyNewLead } from "@/lib/notify";
import { getRegion, regionForZip, REGIONS } from "@/lib/regions/states";

// A partner submitting one referral by hand.
//
// The other path into Lead is a shared spreadsheet somebody works through.
// This one is a contractor standing in a driveway who just remembered a
// customer, so it takes as little as we can get away with and never blocks on
// anything advisory — scoreLead() nudges in the UI, it does not gate here.
//
// Authenticated by the portal token in the path, same as the list route: the
// partner has no account and requiring one before they can send us money would
// be a strange thing to build.

const MAX = { name: 120, phone: 32, address: 200, notes: 2000 };

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Digits to E.164, matching how bought lists are keyed. */
function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  // The texted link is enough only while the account has no password. After
  // that this needs a session — see authorisePartnerToken.
  const authorisedId = await authorisePartnerToken(req, params.token);
  if (!authorisedId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const partner = await prisma.channelPartner.findUnique({
    where: { id: authorisedId },
    select: { id: true, businessName: true },
  });
  if (!partner) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const customerName = clean(body.customerName, MAX.name);
  const rawPhone = clean(body.customerPhone, MAX.phone);
  const address = clean(body.address, MAX.address);

  if (!customerName) return NextResponse.json({ error: "We need their name." }, { status: 400 });
  const phoneKey = toE164(rawPhone);
  if (!phoneKey) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }

  const zip = clean(body.zip, 10).replace(/\D/g, "").slice(0, 5);
  const region = regionForZip(zip) ?? getRegion(clean(body.state, 4));
  if (!region) {
    return NextResponse.json(
      {
        error:
          `We don't cover that area yet, so we can't work this one. Right now it's ` +
          `${REGIONS.map((r) => r.name).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Services the partner ticked, mapped back to price-book trades. The first
  // one becomes `trade` because every downstream screen assumes a single
  // primary; the rest ride along in requestedTrades so the rep going out knows
  // the whole ask.
  const submitted: string[] = Array.isArray(body.trades)
    ? (body.trades as unknown[]).map((t) => String(t).trim().toUpperCase())
    : [];
  const pickedLabels: string[] = [];
  const tradeSet = new Set<string>();
  for (const value of submitted) {
    const service = getService(value);
    if (!service) continue;
    pickedLabels.push(service.label);
    if (service.trade) tradeSet.add(service.trade);
  }
  const tradeValues = Array.from(tradeSet);
  const primaryTrade: string | null = tradeValues[0] ?? null;

  // What the partner did for them, kept with the lead because it is the first
  // sentence of the call: "you had your panels serviced by Apex last spring".
  const relationship = clean(body.relationship, 200);
  const partnerNotes = clean(body.notes, MAX.notes);
  const notes = [
    `Referred by ${partner.businessName}.`,
    relationship ? `Their history: ${relationship}` : null,
    pickedLabels.length ? `Asked about: ${pickedLabels.join(", ")}` : null,
    partnerNotes || null,
  ]
    .filter(Boolean)
    .join("\n");

  // A customer already in the table is not overwritten wholesale — they may
  // already be mid-pipeline from a bought list. But an unclaimed row does get
  // attributed, because the partner genuinely sent them and should be paid.
  const existing = await prisma.lead.findUnique({
    where: { phoneKey },
    select: { id: true, channelPartnerId: true },
  });
  if (existing && existing.channelPartnerId && existing.channelPartnerId !== partner.id) {
    return NextResponse.json(
      { error: "We've already got this number from another partner. Nothing lost — send us another." },
      { status: 409 },
    );
  }

  const lead = await prisma.lead.upsert({
    where: { phoneKey },
    create: {
      customerName,
      customerPhone: rawPhone,
      customerEmail: clean(body.customerEmail, MAX.name) || null,
      address: address || "Address not given",
      city: clean(body.city, MAX.name) || null,
      zip: zip || null,
      state: region.code,
      timeZone: region.timeZone,
      phoneKey,
      trade: primaryTrade,
      requestedTrades: tradeValues.length ? tradeValues.join(",") : null,
      jobKind: "RETAIL",
      source: "channel-partner",
      notes,
      channelPartnerId: partner.id,
    },
    update: {
      channelPartnerId: partner.id,
      ...(address ? { address } : {}),
      ...(zip ? { zip } : {}),
      ...(primaryTrade
        ? { trade: primaryTrade, requestedTrades: tradeValues.join(",") }
        : {}),
      notes,
    },
  });

  await notifyNewLead(lead);

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
