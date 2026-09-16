import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewRepApplication } from "@/lib/notify";

// Somebody applying to sell for us.
//
// Stored as a Rep with status APPLIED rather than in a table of its own: an
// applicant is a rep we have not hired yet, with the same name, phone and
// eventual commission terms, and a second table would only have to be copied
// across on the day they start.

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 32);
  if (!name) return NextResponse.json({ error: "We need your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "That phone number doesn't look right." }, { status: 400 });
  }

  const rep = await prisma.rep.create({
    data: {
      name,
      phone,
      email: clean(body.email, 160) || null,
      city: clean(body.city, 80) || null,
      experience: clean(body.experience, 400) || null,
      notes: clean(body.notes, 1000) || null,
      source: clean(body.source, 40) || "website",
      status: "APPLIED",
      // Not on the roster until somebody says so. An applicant must never show
      // up in a list of people leads can be assigned to.
      active: false,
    },
  });

  await notifyNewRepApplication(rep);

  return NextResponse.json({ ok: true, id: rep.id }, { status: 201 });
}
