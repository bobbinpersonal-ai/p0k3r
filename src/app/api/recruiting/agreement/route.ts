import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { sendForSignature, type AgreementKind } from "@/lib/integrations/pandadoc";
import { crewAgreement } from "@/lib/regions/crewAgreement";
import { CHANNEL_PARTNER_TERMS_VERSION, channelPartnerAgreement } from "@/lib/regions/channelPartnerAgreement";
import { COMPANY } from "@/lib/regions/brand";

// Send somebody their agreement to sign.
//
// The document text comes from the domain module that owns it, never from a
// PandaDoc template, so there is exactly one copy of each contract and the
// version travels with it.

const KINDS = new Set<AgreementKind>(["SUBCONTRACTOR", "REP", "CHANNEL_PARTNER"]);

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { kind?: string; id?: string };
  const kind = String(body.kind ?? "").toUpperCase() as AgreementKind;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!KINDS.has(kind) || !id) {
    return NextResponse.json({ error: "Need kind (SUBCONTRACTOR|REP|CHANNEL_PARTNER) and id." }, { status: 400 });
  }

  if (kind === "CHANNEL_PARTNER") {
    const partner = await prisma.channelPartner.findUnique({
      where: { id },
      select: { id: true, businessName: true, contactName: true, email: true, state: true },
    });
    if (!partner) return NextResponse.json({ error: "Partner not found." }, { status: 404 });
    if (!partner.email) {
      return NextResponse.json({ error: "No email on file to send it to." }, { status: 400 });
    }
    const doc = channelPartnerAgreement({
      businessName: partner.businessName,
      contactName: partner.contactName,
      state: partner.state,
    });
    const sent = await sendForSignature({
      kind,
      recipientName: partner.contactName || partner.businessName,
      recipientEmail: partner.email,
      documentTitle: doc.title,
      documentVersion: CHANNEL_PARTNER_TERMS_VERSION,
      subjectId: partner.id,
    });
    return respond(sent);
  }

  const worker = await prisma.worker.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      state: true,
      trades: true,
      w9OnFile: true,

      generalLiabilityOnFile: true,
      workersCompOnFile: true,
    },
  });
  if (!worker) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!worker.email) {
    return NextResponse.json({ error: "No email on file to send it to." }, { status: 400 });
  }

  const doc = crewAgreement({
    crewName: worker.name,
    state: worker.state ?? undefined,
    trades: worker.trades ? worker.trades.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    w9OnFile: worker.w9OnFile,
    generalLiabilityOnFile: worker.generalLiabilityOnFile,
    workersCompOnFile: worker.workersCompOnFile,

    effective: new Date(),
  });

  const sent = await sendForSignature({
    kind,
    recipientName: worker.name,
    recipientEmail: worker.email,
    documentTitle: doc.title || `Subcontractor Agreement — ${COMPANY.name}`,
    documentVersion: "crew-1",
    subjectId: worker.id,
  });
  return respond(sent);
}

function respond(sent: Awaited<ReturnType<typeof sendForSignature>>) {
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error, retryable: sent.retryable },
      { status: sent.retryable ? 502 : 400 },
    );
  }
  return NextResponse.json({ ok: true, documentId: sent.documentId }, { status: 201 });
}
