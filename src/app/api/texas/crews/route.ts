import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewCrewApplication } from "@/lib/notify";
import { TRADES } from "@/lib/texas/trades";

// A crew applying to install for us.
//
// Stored as a Worker with status APPLIED, for the same reason an applicant rep
// is a Rep: it is the same crew before and after we engage them, and a
// separate applications table would only have to be copied across on the day
// they start.
//
// The insurance answers are recorded as claims, not as facts. A crew ticking
// "yes, I have general liability" has told us something useful and proved
// nothing — the flags on the Worker row stay false until somebody has a
// certificate in their hand, because those flags gate the subcontractor
// agreement's warnings and eventually the payout.

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const VALID_TRADES = new Set(TRADES.map((t) => t.value));

function parseTrades(value: unknown): string | null {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const picked = raw
    .map((t) => String(t).trim().toUpperCase())
    .filter((t) => VALID_TRADES.has(t));
  return picked.length ? Array.from(new Set(picked)).join(",") : null;
}

function parseCount(value: unknown, max: number): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), max) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 32);
  if (!name) return NextResponse.json({ error: "We need your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }

  const trades = parseTrades(body.trades);

  // What they told us about insurance goes in the notes, verbatim and labelled
  // as their claim, so the phone screen starts from what they said rather than
  // from a checkbox somebody has to remember the meaning of.
  const claims = [
    body.hasGeneralLiability ? "Says they carry general liability." : "Says NO general liability.",
    body.hasWorkersComp ? "Says they carry workers' comp." : "Says no workers' comp.",
    body.hasW9 ? "Can provide a W-9." : "No W-9 yet.",
  ].join(" ");

  const worker = await prisma.worker.create({
    data: {
      name,
      phone,
      email: clean(body.email, 160) || null,
      city: clean(body.city, 80) || null,
      trades,
      crewSize: parseCount(body.crewSize, 99),
      dailyCapacity: parseCount(body.dailyCapacity, 99),
      experience: clean(body.experience, 600) || null,
      language: clean(body.language, 40) || null,
      notes: claims,
      source: clean(body.source, 40) || "website",
      status: "APPLIED",
      // Not on the roster until somebody has seen a certificate. An applicant
      // must never show up in a list of crews a job can be given to.
      active: false,
      // Claims, not proof. These stay false until a document exists.
      generalLiabilityOnFile: false,
      workersCompOnFile: false,
      w9OnFile: false,
    },
  });

  await notifyNewCrewApplication(worker);

  return NextResponse.json({ ok: true, id: worker.id }, { status: 201 });
}
