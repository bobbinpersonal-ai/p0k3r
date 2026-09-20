import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { REGIONS } from "@/lib/regions/states";

// Bulk import of an aged lead list.
//
// Accepts the CSV, records everything, and marks WHAT CONSENT IT DOES NOT
// HAVE. That last part is the whole point of this file.
//
// An import cannot create consent. Whoever uploads a list can tick any box
// they like, and the FCC does not accept the uploader's word as the
// subscriber's consent — so rows land with smsConsentSource "IMPORTED",
// which maySms() refuses, and with no call consent at all. What they can
// lawfully receive on day one is EMAIL, under CAN-SPAM, which needs no prior
// consent. A reply to that email is an enquiry, which opens a three-month
// window for a manual dial.
//
// That sequence is not a limitation, it is the campaign. Texting five
// thousand aged records on day one is $500–$1,500 per message of exposure
// and it is the single fastest way to end this business.
//
// Every row carries an importBatch so one bad list can be quarantined
// without touching the rest.

const MAX_ROWS = 20_000;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const STATE_CODES = new Set(REGIONS.map((r) => r.code as string));

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** Split a CSV line, honouring quoted fields containing commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === "," || ch === "\t") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const HEADERS: Record<string, readonly string[]> = {
  name: ["name", "full name", "customer", "customer name", "first name"],
  phone: ["phone", "mobile", "cell", "phone number", "telephone"],
  email: ["email", "e-mail", "email address"],
  address: ["address", "street", "address1", "street address"],
  city: ["city", "town"],
  state: ["state", "st"],
  zip: ["zip", "postal", "zip code", "postcode"],
};

function columnFor(header: string[], key: keyof typeof HEADERS): number {
  const wanted = HEADERS[key];
  return header.findIndex((h) => wanted.includes(h.toLowerCase().trim()));
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { csv?: string; batchName?: string };
  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) return NextResponse.json({ error: "No CSV supplied." }, { status: 400 });

  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "Needs a header row and at least one record." }, { status: 400 });
  }
  if (lines.length - 1 > MAX_ROWS) {
    return NextResponse.json(
      { error: `${lines.length - 1} rows. Split it into batches of ${MAX_ROWS}.` },
      { status: 400 },
    );
  }

  const header = splitCsvLine(lines[0]);
  const idx = {
    name: columnFor(header, "name"),
    phone: columnFor(header, "phone"),
    email: columnFor(header, "email"),
    address: columnFor(header, "address"),
    city: columnFor(header, "city"),
    state: columnFor(header, "state"),
    zip: columnFor(header, "zip"),
  };
  if (idx.name < 0 || (idx.phone < 0 && idx.email < 0)) {
    return NextResponse.json(
      { error: "Needs at least a name column and a phone or email column." },
      { status: 400 },
    );
  }

  const batch = clean(body.batchName, 60) || `import-${new Date().toISOString().slice(0, 10)}`;

  // Everything already on file, so re-importing last month's list reports
  // the overlap rather than creating duplicate people.
  const knownPhones = new Set(
    (await prisma.lead.findMany({ select: { customerPhone: true } })).map((l) => l.customerPhone),
  );

  const rows: {
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
  }[] = [];
  const reasons: string[] = [];
  let skipped = 0;

  lines.slice(1).forEach((line, i) => {
    const cols = splitCsvLine(line);
    const name = clean(cols[idx.name], 200);
    const phone = idx.phone >= 0 ? toE164(clean(cols[idx.phone], 40)) : null;

    if (!name) { skipped++; if (reasons.length < 10) reasons.push(`Row ${i + 2}: no name.`); return; }
    if (!phone) { skipped++; if (reasons.length < 10) reasons.push(`Row ${i + 2}: "${name}" has no usable phone.`); return; }
    if (knownPhones.has(phone)) { skipped++; if (reasons.length < 10) reasons.push(`Row ${i + 2}: "${name}" is already on file.`); return; }

    knownPhones.add(phone);
    const state = idx.state >= 0 ? clean(cols[idx.state], 2).toUpperCase() : "";
    rows.push({
      customerName: name,
      customerPhone: phone,
      customerEmail: idx.email >= 0 ? clean(cols[idx.email], 200).toLowerCase() || null : null,
      // Lead.address is NOT NULL — same placeholder the web intake uses.
      address: (idx.address >= 0 ? clean(cols[idx.address], 300) : "") || "Address to confirm on call",
      city: idx.city >= 0 ? clean(cols[idx.city], 120) || null : null,
      state: STATE_CODES.has(state) ? state : null,
      zip: idx.zip >= 0 ? clean(cols[idx.zip], 12) || null : null,
    });
  });

  if (rows.length > 0) {
    await prisma.lead.createMany({
      data: rows.map((r) => ({
        ...r,
        status: "NEW",
        source: "AGED_IMPORT",
        importBatch: batch,
        // The honest record. An uploader cannot create consent, so the row
        // says where the claim came from and maySms() refuses it.
        smsConsentSource: "IMPORTED",
        smsConsentAt: null,
        callConsentAt: null,
      })),
      skipDuplicates: true,
    });
  }

  const withEmail = rows.filter((r) => r.customerEmail).length;

  return NextResponse.json(
    {
      ok: true,
      batch,
      imported: rows.length,
      skipped,
      reasons,
      // Told plainly at import time rather than discovered when a campaign
      // silently sends to nobody.
      contactable: {
        emailNow: withEmail,
        smsNow: 0,
        callNow: 0,
        note:
          `An import cannot create consent. ${withEmail} of these have an email and can be ` +
          `contacted today under CAN-SPAM. None may be texted or dialled until they reply, ` +
          `enquire, or give consent themselves — a reply opens a 3-month window for a manual ` +
          `dial. Run the email sequence first: POST /api/campaigns/reengage.`,
      },
    },
    { status: 201 },
  );
}
