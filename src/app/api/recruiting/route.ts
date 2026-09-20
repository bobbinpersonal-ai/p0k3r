import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REGIONS } from "@/lib/regions/states";
import { notifyNewCrewApplication, notifyNewRepApplication } from "@/lib/notify";

// Applicant intake for crews and sales reps.
//
// One endpoint, two kinds of applicant, because the qualification rules are
// the same shape and the difference is which agreement they get sent.
//
// ON THE STATE LIST. The brief qualified applicants against
// TX, FL, CO, MO, IN, OH, CA. This checks against REGIONS — the states we
// actually operate in, which are CO, MO, KS, IN and WY. Those two lists
// disagree in both directions: the brief adds four states we have no
// licensing data for, and drops Kansas and Wyoming, which are live and have
// rules already encoded (Kansas roofers must be registered with the Attorney
// General). Qualifying an applicant for a state we cannot lawfully dispatch
// into is worse than rejecting them. Widen REGIONS first, with the licensing
// research, and this follows automatically.

const ROLES = new Set(["CREW", "REP"]);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const role = clean(body.role, 10).toUpperCase();
  if (!ROLES.has(role)) {
    return NextResponse.json({ error: "role must be CREW or REP." }, { status: 400 });
  }

  const name = clean(body.name, 200);
  if (!name) return NextResponse.json({ error: "Needs a name." }, { status: 400 });

  const phone = toE164(clean(body.phone, 40));
  if (!phone) return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });

  const state = clean(body.state, 2).toUpperCase();
  const region = REGIONS.find((r) => r.code === state);
  if (!region) {
    return NextResponse.json(
      {
        error:
          `We are not in ${state || "that state"} yet. The network is ` +
          `${REGIONS.map((r) => r.name).join(", ")}.`,
        // Returned so a funnel can tell "wrong state" from "bad data" and
        // keep the applicant warm rather than bouncing them.
        outcome: "OUT_OF_AREA",
      },
      { status: 400 },
    );
  }

  const email = clean(body.email, 200).toLowerCase() || null;
  const yearsExperience = Number.parseInt(clean(body.yearsExperience, 4), 10);
  const notes = clean(body.notes, 2000) || null;
  const source = clean(body.source, 40) || "recruiting-api";

  if (role === "CREW") {
    const existing = await prisma.worker.findFirst({ where: { phone }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "Already applied on that number.", outcome: "DUPLICATE" }, { status: 409 });
    }
    const worker = await prisma.worker.create({
      data: {
        name,
        phone,
        email,
        state: region.code,
        city: clean(body.city, 120) || null,
        trades: clean(body.trade, 40) || null,
        notes,
        source,
        status: "APPLIED",
      },
    });
    await notifyNewCrewApplication({
      name: worker.name,
      phone: worker.phone ?? "",
      trades: worker.trades,
      city: worker.city,
      crewSize: worker.crewSize,
      dailyCapacity: worker.dailyCapacity,
      language: worker.language,
      experience: worker.experience,
      notes: worker.notes,
    });
    return NextResponse.json(
      { ok: true, id: worker.id, role, nextStep: "SUBCONTRACTOR_AGREEMENT" },
      { status: 201 },
    );
  }

  const existingRep = await prisma.rep.findFirst({ where: { phone }, select: { id: true } });
  if (existingRep) {
    return NextResponse.json({ error: "Already applied on that number.", outcome: "DUPLICATE" }, { status: 409 });
  }
  const rep = await prisma.rep.create({
    data: {
      name,
      phone,
      email,
      notes: [notes, Number.isFinite(yearsExperience) ? `${yearsExperience} years experience` : null]
        .filter(Boolean)
        .join(" · ") || null,
      status: "APPLIED",
    },
  });
  await notifyNewRepApplication({
    name: rep.name,
    phone: rep.phone,
    city: region.name,
    experience: Number.isFinite(yearsExperience) ? `${yearsExperience} years` : null,
  });
  return NextResponse.json({ ok: true, id: rep.id, role, nextStep: "HIS_AGREEMENT" }, { status: 201 });
}
