import { CALLRAIL, safeEqual } from "@/lib/integrations/config";

// CallRail: which advert produced which phone call.
//
// The value here is not the call recording, it is the attribution. Without
// it every inbound call is "somebody rang" and the only way to know what
// marketing works is to ask people, which they answer badly. With it a
// booked job traces back to a keyword.
//
// WHAT WE DO NOT DO. CallRail can record calls. Colorado is a one-party
// consent state but several states in and around the network are not, and
// an out-of-state caller drags their own state's rule along with them. The
// codebase already takes the strict line — RECORDING_CONSENT_RULE in
// calling.ts is ALL_PARTY — so recordings are not fetched or stored here.
// Turning that on is a legal decision, not a feature flag.

export type CallRailEvent = {
  callId: string;
  direction: "inbound" | "outbound";
  customerPhone: string | null;
  /** The tracking number they dialled, which is what identifies the source. */
  trackingPhone: string | null;
  source: string | null;
  keywords: string | null;
  campaign: string | null;
  durationSeconds: number;
  answered: boolean;
  firstCall: boolean;
};

/** Read a CallRail post-call webhook into the fields worth keeping. */
export function parseCallEvent(payload: unknown): CallRailEvent | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;
  const callId = typeof p.id === "string" ? p.id : null;
  if (!callId) return null;

  const str = (k: string) => (typeof p[k] === "string" && p[k] ? (p[k] as string) : null);

  return {
    callId,
    direction: p.direction === "outbound" ? "outbound" : "inbound",
    customerPhone: str("customer_phone_number"),
    trackingPhone: str("tracking_phone_number"),
    source: str("source"),
    keywords: str("keywords"),
    campaign: str("campaign"),
    durationSeconds: Number(p.duration) || 0,
    answered: p.answered === true,
    firstCall: p.first_call === true,
  };
}

/**
 * A single attribution string for the Lead.source column.
 *
 * Collapsed to one field rather than five new columns because that is what
 * every existing report reads, and a source nobody can group by is a source
 * nobody uses.
 */
export function attributionLabel(e: CallRailEvent): string {
  const parts = [e.source, e.campaign, e.keywords].filter(Boolean);
  return parts.length ? `callrail:${parts.join("/")}`.slice(0, 120) : "callrail";
}

/**
 * Is this call worth creating a lead from?
 *
 * A six-second call is a wrong number or a hang-up, and a lead row for every
 * one of those turns the pipeline into noise nobody works. Thirty seconds is
 * roughly where somebody has actually said what they want.
 */
export const MIN_CALL_SECONDS = 30;

export function worthALead(e: CallRailEvent): boolean {
  return e.direction === "inbound" && e.answered && e.durationSeconds >= MIN_CALL_SECONDS;
}

export function verifyCallRailWebhook(signature: string | null): boolean {
  if (!CALLRAIL.webhookSecret) return false;
  return safeEqual(signature ?? undefined, CALLRAIL.webhookSecret);
}
