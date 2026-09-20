import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSigned, parseSignatureEvent, verifyPandadocWebhook } from "@/lib/integrations/pandadoc";

// A signed agreement coming back.
//
// Flips the signer from APPLIED to ACTIVE and records WHICH VERSION they
// signed. The version is the part that matters: "they agreed" means nothing
// a year later unless it means "they agreed to this text", and the terms
// change.

export async function POST(req: NextRequest) {
  if (!verifyPandadocWebhook(req.headers.get("x-pandadoc-signature"))) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const event = parseSignatureEvent(payload);
  if (!event) return NextResponse.json({ error: "Unrecognised payload." }, { status: 400 });
  if (!isSigned(event)) return NextResponse.json({ ok: true, ignored: event.status });
  if (!event.subjectId) return NextResponse.json({ ok: true, ignored: "no subjectId" });

  const signedAt = event.signedAt ?? new Date();

  if (event.kind === "CHANNEL_PARTNER") {
    await prisma.channelPartner.updateMany({
      where: { id: event.subjectId },
      data: {
        termsAcceptedAt: signedAt,
        termsVersion: event.documentVersion ?? undefined,
        status: "ACTIVE",
      },
    });
    return NextResponse.json({ ok: true, subject: "channelPartner" });
  }

  // A crew is only ACTIVE once the paperwork is real. Insurance is checked
  // separately and still gates dispatch — signing does not override it.
  await prisma.worker.updateMany({
    where: { id: event.subjectId, status: "APPLIED" },
    data: { status: "ACTIVE" },
  });
  return NextResponse.json({ ok: true, subject: "worker" });
}
