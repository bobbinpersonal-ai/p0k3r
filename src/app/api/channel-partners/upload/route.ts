import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { partnerFromRequest } from "@/lib/partnerAuth";
import { isTrack } from "@/lib/regions/warmup";
import { regionForZip } from "@/lib/regions/states";

// A partner uploading their customer list.
//
// The alternative they already have is sharing a Google Sheet, which works and
// which some of them prefer. This is for the ones who would rather hand over a
// file once and be done — and it is where the warm-up track gets chosen,
// because the moment somebody is deciding to hand over 1,400 customers is the
// moment they care most about how those customers get approached.
//
// Parsed here rather than in the browser so the row limit, the dedupe and the
// region check are all enforced somewhere a partner cannot skip.

const MAX_ROWS = 5_000;

/** Minimal CSV reader: quoted fields, escaped quotes, CRLF. No dependency. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

/** Find a column by any of several likely headings. */
function columnFor(headers: string[], ...names: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  for (const name of names) {
    const idx = lower.indexOf(name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  const partner = await partnerFromRequest(req);
  if (!partner) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const track = typeof body.track === "string" ? body.track : "";
  if (!isTrack(track)) {
    return NextResponse.json({ error: "Pick how you want them approached." }, { status: 400 });
  }

  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) return NextResponse.json({ error: "That file was empty." }, { status: 400 });

  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "Needs a header row and at least one customer." },
      { status: 400 },
    );
  }

  const headers = rows[0];
  const nameCol = columnFor(headers, "name", "customer", "customername", "fullname", "client");
  const phoneCol = columnFor(headers, "phone", "phonenumber", "mobile", "cell", "telephone");
  const emailCol = columnFor(headers, "email", "emailaddress");
  const addressCol = columnFor(headers, "address", "street", "streetaddress", "serviceaddress");
  const cityCol = columnFor(headers, "city", "town");
  const zipCol = columnFor(headers, "zip", "zipcode", "postcode", "postalcode");

  if (nameCol === -1 || phoneCol === -1) {
    return NextResponse.json(
      {
        error:
          "We need at least a name column and a phone column. Rename the headings to " +
          `"Name" and "Phone" and try again.`,
      },
      { status: 400 },
    );
  }

  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  const body_rows = rows.slice(1, MAX_ROWS + 1);
  const seen = new Set<string>();
  const candidates: {
    customerName: string;
    phoneKey: string;
    customerPhone: string;
    customerEmail: string | null;
    address: string;
    city: string | null;
    zip: string | null;
    state: string | null;
  }[] = [];

  let skippedNoPhone = 0;
  let skippedOutOfArea = 0;

  for (const r of body_rows) {
    const name = cell(r, nameCol).slice(0, 120);
    const phoneKey = toE164(cell(r, phoneCol));
    if (!name || !phoneKey) {
      skippedNoPhone++;
      continue;
    }
    if (seen.has(phoneKey)) continue;

    const zip = cell(r, zipCol).replace(/\D/g, "").slice(0, 5);
    // A ZIP we do not cover is dropped rather than imported and quietly
    // ignored: a partner who uploads 900 and sees 900 assumes we are working
    // 900. A row with no ZIP at all is kept — plenty of customer lists have
    // none, and the desk finds out where they are on the call.
    const region = zip ? regionForZip(zip) : null;
    if (zip && !region) {
      skippedOutOfArea++;
      continue;
    }

    seen.add(phoneKey);
    candidates.push({
      customerName: name,
      phoneKey,
      customerPhone: phoneKey,
      customerEmail: cell(r, emailCol).slice(0, 160) || null,
      // Lead.address is NOT NULL — same placeholder the website intake uses
      // when somebody declines to give one.
      address: cell(r, addressCol).slice(0, 200) || "Address to confirm on call",
      city: cell(r, cityCol).slice(0, 80) || null,
      zip: zip || null,
      state: region?.code ?? null,
    });
  }

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "Nothing usable in that file — every row was missing a name or a phone number." },
      { status: 400 },
    );
  }

  // Anybody already in the table stays as they are. They may be mid-pipeline
  // from another source, and a re-upload must not reset that.
  const existing = await prisma.lead.findMany({
    where: { phoneKey: { in: candidates.map((c) => c.phoneKey) } },
    select: { phoneKey: true },
  });
  const known = new Set(existing.map((e) => e.phoneKey));
  const fresh = candidates.filter((c) => !known.has(c.phoneKey));

  if (fresh.length > 0) {
    await prisma.lead.createMany({
      data: fresh.map((c) => ({
        ...c,
        channelPartnerId: partner.id,
        status: "NEW",
        // Unwarmed on every track. On the two warming tracks this is what
        // holds the desk back until the introduction has gone.
        warmupStatus: "UNWARMED",
        source: "partner-upload",
        notes: `Uploaded by ${partner.businessName}.`,
      })),
    });
  }

  // The track is the partner's standing preference, updated on each upload
  // because it is the moment they last thought about it.
  await prisma.channelPartner.update({
    where: { id: partner.id },
    data: { warmupTrack: track, listSharedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    imported: fresh.length,
    alreadyKnown: candidates.length - fresh.length,
    skippedNoPhone,
    skippedOutOfArea,
    track,
  });
}
