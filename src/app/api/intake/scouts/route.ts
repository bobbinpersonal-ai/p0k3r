import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SCOUT_ROLE } from "@/lib/regions/scouts";
import { getRegion, REGIONS } from "@/lib/regions/states";

// Somebody applying to sign businesses onto the network.
//
// Writes a Rep with role SCOUT and status APPLIED rather than filling a second
// table: a scout and a closer are the same person shape — name, phone, W-9,
// payout rail — and differ only in the arithmetic that pays them. See
// Rep.role in prisma/schema.prisma.
//
// "OTHER" is an accepted answer for state on purpose. A good closer in Phoenix
// calling into Denver is a perfectly fine scout, and rejecting them at the form
// would be filtering on the wrong thing.

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 32);
  const experience = clean(body.experience, 1000);

  if (!name) return NextResponse.json({ error: "We need your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }
  if (!experience) {
    return NextResponse.json(
      { error: "Tell us what you've sold — it's the whole screen." },
      { status: 400 },
    );
  }

  const rawState = clean(body.state, 8).toUpperCase();
  const region = rawState === "OTHER" ? null : getRegion(rawState);
  if (rawState && rawState !== "OTHER" && !region) {
    return NextResponse.json(
      { error: `Pick one of: ${REGIONS.map((r) => r.name).join(", ")}, or "somewhere else".` },
      { status: 400 },
    );
  }

  const rep = await prisma.rep.create({
    data: {
      name,
      phone,
      email: clean(body.email, 160) || null,
      role: SCOUT_ROLE,
      status: "APPLIED",
      active: false,
      city: region ? region.name : rawState === "OTHER" ? "Outside the network" : null,
      experience,
      source: clean(body.source, 40) || "scouts",
    },
  });

  return NextResponse.json({ ok: true, id: rep.id }, { status: 201 });
}
