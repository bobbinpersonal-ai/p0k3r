import { GHL, safeEqual } from "@/lib/integrations/config";

// GoHighLevel: the CRM and pipeline system of record.
//
// GHL owns the contact, the opportunity and the stage. This app owns the
// money — the price book, the 15% margin floor, the channel partner's 40%,
// the payout gates — because none of that exists in GHL and none of it can
// be expressed in a GHL workflow.
//
// So the integration is deliberately narrow. We read booked appointments out
// of GHL and push stage changes back in. We do not mirror GHL's whole data
// model, and we never let a GHL field decide what somebody gets paid.

export type GhlAppointmentPayload = {
  contactId?: string;
  opportunityId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  /** What the workflow tagged the project as. */
  customFields?: Record<string, unknown>;
  calendar?: { startTime?: string; endTime?: string; appointmentId?: string };
  startTime?: string;
  tags?: string[];
};

export type NormalisedAppointment = {
  ghlContactId: string;
  ghlOpportunityId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  startsAt: Date | null;
  trade: string | null;
  tags: string[];
};

/**
 * Flatten whatever GHL sent into the shape this app stores.
 *
 * GHL's webhook payload varies by trigger and by how the workflow was built,
 * so every field here has more than one possible home. Returning null rather
 * than throwing, because a malformed webhook must not 500 — it must be
 * logged and rejected with a reason the person who built the workflow can
 * act on.
 */
export function normaliseAppointment(
  payload: GhlAppointmentPayload,
): { ok: true; value: NormalisedAppointment } | { ok: false; error: string } {
  const ghlContactId = payload.contactId?.trim();
  if (!ghlContactId) return { ok: false, error: "No contactId on the payload." };

  const name =
    payload.fullName?.trim() ||
    payload.name?.trim() ||
    [payload.firstName, payload.lastName].filter(Boolean).join(" ").trim();
  if (!name) return { ok: false, error: "No name on the payload." };

  const phone = normalisePhone(payload.phone);
  if (!phone) return { ok: false, error: "No usable phone number on the payload." };

  // Lead.address is NOT NULL — see CLAUDE.md §6. Same placeholder the web
  // intake uses rather than refusing an otherwise good appointment.
  const address =
    payload.address1?.trim() || payload.address?.trim() || "Address to confirm on call";

  const startRaw = payload.calendar?.startTime || payload.startTime;
  const startsAt = startRaw ? new Date(startRaw) : null;

  return {
    ok: true,
    value: {
      ghlContactId,
      ghlOpportunityId: payload.opportunityId?.trim() || null,
      customerName: name.slice(0, 200),
      customerPhone: phone,
      customerEmail: payload.email?.trim().toLowerCase() || null,
      address: address.slice(0, 300),
      city: payload.city?.trim() || null,
      state: payload.state?.trim().toUpperCase().slice(0, 2) || null,
      zip: payload.postalCode?.trim() || null,
      startsAt: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
      trade: readTrade(payload.customFields),
      tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
    },
  };
}

function normalisePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

function readTrade(fields: Record<string, unknown> | undefined): string | null {
  if (!fields) return null;
  for (const key of ["project_type", "projectType", "trade", "service"]) {
    const v = fields[key];
    if (typeof v === "string" && v.trim()) return v.trim().toUpperCase().replace(/\s+/g, "_");
  }
  return null;
}

/** Whether an inbound GHL webhook is really from GHL. */
export function verifyGhlWebhook(headerSecret: string | null): boolean {
  if (!GHL.webhookSecret) return false; // unconfigured means closed, not open
  return safeEqual(headerSecret ?? undefined, GHL.webhookSecret);
}

async function ghlFetch(path: string, init: RequestInit): Promise<Response> {
  if (!GHL.apiKey) throw new Error("GHL_API_KEY is not set.");
  return fetch(`${GHL.apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GHL.apiKey}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
      ...(init.headers ?? {}),
    },
  });
}

/**
 * Move an opportunity to a stage.
 *
 * Fails soft. A stage that did not sync is a reporting problem; throwing here
 * would roll back a job that has already been created and paid for.
 */
export async function pushStage(
  opportunityId: string,
  stageId: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!stageId) return { ok: false, error: "No stage id configured." };
  try {
    const res = await ghlFetch(`/opportunities/${opportunityId}`, {
      method: "PUT",
      body: JSON.stringify({ pipelineStageId: stageId }),
    });
    if (!res.ok) return { ok: false, error: `GHL returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "GHL unreachable" };
  }
}

/** Write a note back onto the contact, so the CRM shows what happened here. */
export async function addNote(contactId: string, body: string): Promise<{ ok: boolean }> {
  try {
    const res = await ghlFetch(`/contacts/${contactId}/notes`, {
      method: "POST",
      body: JSON.stringify({ body: body.slice(0, 5000) }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
