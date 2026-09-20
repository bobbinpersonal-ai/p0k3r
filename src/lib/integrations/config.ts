// Every external vendor, in one typed place.
//
// The brief asked for `config/stack-environment.json` holding "all API keys".
// That file exists but holds NO secrets — it is the map (endpoints, webhook
// paths, field mappings, which env var carries which credential) and it is
// safe to commit. Credentials are read here, from the environment, and only
// ever exist in Vercel. Putting a key in a repo file is the one mistake in
// this whole integration that cannot be undone by a later commit.
//
// Everything is optional. A missing vendor is a disabled feature, never a
// crash: this app has to keep selling roofs on a day when Jobber is not
// configured yet.

import { timingSafeEqual } from "node:crypto";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export type VendorStatus = { configured: boolean; missing: readonly string[] };

function status(vars: Record<string, string | undefined>): VendorStatus {
  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return { configured: missing.length === 0, missing };
}

/** GoHighLevel — the CRM and pipeline system of record. */
export const GHL = {
  apiKey: env("GHL_API_KEY"),
  locationId: env("GHL_LOCATION_ID"),
  /** Shared secret GHL signs its outbound webhooks with. */
  webhookSecret: env("GHL_WEBHOOK_SECRET"),
  apiBase: env("GHL_API_BASE") || "https://services.leadconnectorhq.com",
  /** Pipeline and stage ids, so a stage move can be pushed back. */
  pipelineId: env("GHL_PIPELINE_ID"),
  stageBooked: env("GHL_STAGE_BOOKED_APPOINTMENT"),
  stageSold: env("GHL_STAGE_SOLD"),
} as const;

export const ghlStatus = () =>
  status({ GHL_API_KEY: GHL.apiKey, GHL_LOCATION_ID: GHL.locationId });

/** Jobber — scheduled jobs, crew calendars, on-site invoicing. */
export const JOBBER = {
  accessToken: env("JOBBER_ACCESS_TOKEN"),
  refreshToken: env("JOBBER_REFRESH_TOKEN"),
  clientId: env("JOBBER_CLIENT_ID"),
  clientSecret: env("JOBBER_CLIENT_SECRET"),
  webhookSecret: env("JOBBER_WEBHOOK_SECRET"),
  apiBase: env("JOBBER_API_BASE") || "https://api.getjobber.com/api/graphql",
  /** Jobber pins the schema by date; changing this changes the contract. */
  apiVersion: env("JOBBER_API_VERSION") || "2024-06-10",
} as const;

export const jobberStatus = () =>
  status({ JOBBER_ACCESS_TOKEN: JOBBER.accessToken, JOBBER_CLIENT_ID: JOBBER.clientId });

/** Stripe Connect — deposits, margin retention, contractor payouts. */
export const STRIPE = {
  secretKey: env("STRIPE_SECRET_KEY"),
  publishableKey: env("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  webhookSecret: env("STRIPE_WEBHOOK_SECRET"),
  /** Connect account type. "express" is the sane default for trade crews. */
  connectAccountType: env("STRIPE_CONNECT_ACCOUNT_TYPE") || "express",
} as const;

export const stripeStatus = () =>
  status({ STRIPE_SECRET_KEY: STRIPE.secretKey, STRIPE_WEBHOOK_SECRET: STRIPE.webhookSecret });

/** Twilio — outbound SMS. Consent is checked before anything is sent. */
export const TWILIO = {
  accountSid: env("TWILIO_ACCOUNT_SID"),
  authToken: env("TWILIO_AUTH_TOKEN"),
  fromNumber: env("TWILIO_FROM_NUMBER"),
  messagingServiceSid: env("TWILIO_MESSAGING_SERVICE_SID"),
} as const;

export const twilioStatus = () =>
  status({ TWILIO_ACCOUNT_SID: TWILIO.accountSid, TWILIO_AUTH_TOKEN: TWILIO.authToken });

/** Consumer financing — WiseTack or Hearth. */
export const LENDER = {
  provider: env("LENDER_PROVIDER"), // "wisetack" | "hearth"
  apiKey: env("LENDER_API_KEY"),
  apiBase: env("LENDER_API_BASE"),
  webhookSecret: env("LENDER_WEBHOOK_SECRET"),
  /** Where a homeowner is sent to apply. Merchant-specific. */
  applyUrlTemplate: env("LENDER_APPLY_URL_TEMPLATE"),
} as const;

export const lenderStatus = () =>
  status({ LENDER_PROVIDER: LENDER.provider, LENDER_API_KEY: LENDER.apiKey });

/** PandaDoc — remote signature on subcontractor and rep agreements. */
export const PANDADOC = {
  apiKey: env("PANDADOC_API_KEY"),
  apiBase: env("PANDADOC_API_BASE") || "https://api.pandadoc.com/public/v1",
  webhookSecret: env("PANDADOC_WEBHOOK_SECRET"),
  templateSubcontractor: env("PANDADOC_TEMPLATE_SUBCONTRACTOR"),
  templateRep: env("PANDADOC_TEMPLATE_REP"),
  templateChannelPartner: env("PANDADOC_TEMPLATE_CHANNEL_PARTNER"),
} as const;

export const pandadocStatus = () => status({ PANDADOC_API_KEY: PANDADOC.apiKey });

/** CallRail — dynamic number insertion and call attribution. */
export const CALLRAIL = {
  apiKey: env("CALLRAIL_API_KEY"),
  accountId: env("CALLRAIL_ACCOUNT_ID"),
  webhookSecret: env("CALLRAIL_WEBHOOK_SECRET"),
} as const;

export const callrailStatus = () => status({ CALLRAIL_API_KEY: CALLRAIL.apiKey });

/** AirCall — the offshore team's softphone. */
export const AIRCALL = {
  apiId: env("AIRCALL_API_ID"),
  apiToken: env("AIRCALL_API_TOKEN"),
  webhookSecret: env("AIRCALL_WEBHOOK_SECRET"),
} as const;

export const aircallStatus = () => status({ AIRCALL_API_ID: AIRCALL.apiId });

/** Everything, for the admin health screen and for setup docs. */
export function integrationHealth() {
  return {
    ghl: ghlStatus(),
    jobber: jobberStatus(),
    stripe: stripeStatus(),
    twilio: twilioStatus(),
    lender: lenderStatus(),
    pandadoc: pandadocStatus(),
    callrail: callrailStatus(),
    aircall: aircallStatus(),
  };
}

/**
 * Constant-time comparison for webhook shared secrets.
 *
 * Every inbound webhook in this integration authenticates with one of these.
 * `===` on a secret leaks its prefix through timing, which is cheap to avoid
 * and expensive to discover you did not.
 */
export function safeEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
