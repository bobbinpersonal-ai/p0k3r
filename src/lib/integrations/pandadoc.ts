import { PANDADOC, safeEqual } from "@/lib/integrations/config";

// Remote signature on the agreements.
//
// The agreements themselves are generated from src/lib/regions/*Agreement.ts
// and are versioned there. PandaDoc is only the signing surface — we send
// the text we already produce, we do not let a PandaDoc template become a
// second copy of the contract. Two copies of a contract is how a partner
// ends up signing terms nobody in the building has read.
//
// A STANDING WARNING, REPEATED HERE BECAUSE THIS IS THE FILE THAT SCALES IT.
// None of these agreements has been reviewed by a lawyer; they say so in
// their own `warnings` arrays. Sending one to a stranger is a risk somebody
// accepted once. Sending eighty a week through an API multiplies whatever is
// wrong with them by eighty. Get them reviewed before this is switched on in
// volume.

export type AgreementKind = "SUBCONTRACTOR" | "REP" | "CHANNEL_PARTNER";

function templateFor(kind: AgreementKind): string | undefined {
  switch (kind) {
    case "SUBCONTRACTOR":
      return PANDADOC.templateSubcontractor;
    case "REP":
      return PANDADOC.templateRep;
    case "CHANNEL_PARTNER":
      return PANDADOC.templateChannelPartner;
  }
}

export type SendResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string; retryable: boolean };

/**
 * Create a document from our own text and send it for signature.
 *
 * `documentVersion` is passed through as metadata so a signed document can
 * always be tied back to the exact terms that were signed — which is the
 * only thing that makes "they agreed" mean anything when the terms change
 * later. See CHANNEL_PARTNER_TERMS_VERSION.
 */
export async function sendForSignature(args: {
  kind: AgreementKind;
  recipientName: string;
  recipientEmail: string;
  /** The rendered agreement, from the domain module that owns it. */
  documentTitle: string;
  documentVersion: string;
  /** Our own id for whoever is signing, so a webhook can find them. */
  subjectId: string;
}): Promise<SendResult> {
  if (!PANDADOC.apiKey) {
    return { ok: false, error: "PANDADOC_API_KEY is not set.", retryable: false };
  }
  const templateId = templateFor(args.kind);
  if (!templateId) {
    return { ok: false, error: `No PandaDoc template configured for ${args.kind}.`, retryable: false };
  }
  const [firstName, ...rest] = args.recipientName.trim().split(/\s+/);

  try {
    const res = await fetch(`${PANDADOC.apiBase}/documents`, {
      method: "POST",
      headers: {
        Authorization: `API-Key ${PANDADOC.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.documentTitle,
        template_uuid: templateId,
        recipients: [
          {
            email: args.recipientEmail,
            first_name: firstName || args.recipientName,
            last_name: rest.join(" ") || "—",
            role: "signer",
          },
        ],
        metadata: {
          subjectId: args.subjectId,
          kind: args.kind,
          // The version is the whole point of recording anything here.
          documentVersion: args.documentVersion,
        },
      }),
    });

    const json = (await res.json()) as { id?: string; detail?: string };
    if (res.status === 429 || res.status >= 500) {
      return { ok: false, error: `PandaDoc returned ${res.status}`, retryable: true };
    }
    if (!res.ok || !json.id) {
      return { ok: false, error: json.detail ?? `PandaDoc returned ${res.status}`, retryable: false };
    }
    return { ok: true, documentId: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "PandaDoc unreachable", retryable: true };
  }
}

export type SignatureEvent = {
  documentId: string;
  status: string;
  subjectId: string | null;
  kind: AgreementKind | null;
  documentVersion: string | null;
  signedAt: Date | null;
};

/** Read a PandaDoc webhook into the few fields we act on. */
export function parseSignatureEvent(payload: unknown): SignatureEvent | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const first = payload[0] as {
    data?: {
      id?: string;
      status?: string;
      metadata?: Record<string, unknown>;
      date_completed?: string;
    };
  };
  const data = first?.data;
  if (!data?.id || !data.status) return null;

  const meta = data.metadata ?? {};
  const completed = data.date_completed ? new Date(data.date_completed) : null;

  return {
    documentId: data.id,
    status: data.status,
    subjectId: typeof meta.subjectId === "string" ? meta.subjectId : null,
    kind: typeof meta.kind === "string" ? (meta.kind as AgreementKind) : null,
    documentVersion: typeof meta.documentVersion === "string" ? meta.documentVersion : null,
    signedAt: completed && !Number.isNaN(completed.getTime()) ? completed : null,
  };
}

/** PandaDoc's document.completed status, which is the one that matters. */
export function isSigned(event: SignatureEvent): boolean {
  return event.status === "document.completed" || event.status === "completed";
}

export function verifyPandadocWebhook(sharedSecret: string | null): boolean {
  if (!PANDADOC.webhookSecret) return false;
  return safeEqual(sharedSecret ?? undefined, PANDADOC.webhookSecret);
}
