"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CADENCE_LENGTH,
  CALLBACK_HOURS,
  getProspectDisposition,
  isProspectTrade,
  MIN_VIABLE_LIST,
  nextTouchDue,
  NOT_NOW_DAYS,
} from "@/lib/regions/partnerProspects";
import { REGIONS } from "@/lib/regions/states";

// The recruiting hub's writes.
//
// Server Actions for the same reason the homeowner desk uses them: this is
// somebody working a call list at speed, and an action plus revalidatePath is
// one round trip where fetch plus refresh is two.
//
// isAdminRequest() takes a NextRequest and there isn't one here, so the guard
// reads the same cookie through next/headers — same secret, same validator.

function requireAdmin() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Not authorised.");
  }
}

export type RecruitResult = { ok: true } | { ok: false; error: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const STATE_CODES = new Set(REGIONS.map((r) => r.code as string));

/**
 * Normalise a typed phone number to E.164.
 *
 * Returns null rather than guessing when it cannot: a prospect row with a
 * mangled number is worse than one with no number, because it gets dialled.
 */
function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

/**
 * Record what a prospecting call did.
 *
 * Writes the permanent log and the denormalised latest on the partner row, in
 * one transaction, so the queue never shows a disposition whose call is
 * missing from the history.
 */
export async function logCall(
  partnerId: string,
  outcome: string,
  notes?: string,
  calledBy = "recruit",
): Promise<RecruitResult> {
  try {
    requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const disposition = getProspectDisposition(outcome);
  if (!disposition || outcome === "NEW") {
    return { ok: false, error: "Not an outcome we know." };
  }

  const partner = await prisma.channelPartner.findUnique({
    where: { id: partnerId },
    select: { id: true, status: true, callCount: true, cadenceStep: true },
  });
  if (!partner) return { ok: false, error: "Prospect not found." };

  const now = new Date();

  // Where the sequence goes next.
  //
  // Most outcomes advance it: a touch happened, so the next one is due after
  // the next gap. Three do not, and each for its own reason.
  //
  //   CALLBACK  — they named a time. Their time beats the sequence, and
  //               advancing would also skip a touch they already answered.
  //   NOT_NOW   — a real "not this quarter". Parked long, and the sequence
  //               holds where it is so it resumes rather than restarts.
  //   closing   — SIGNED_UP and DEAD end it outright.
  const closes = disposition.closes;
  const holds = outcome === "CALLBACK" || outcome === "NOT_NOW";
  const cadenceStep = closes || holds ? partner.cadenceStep : Math.min(partner.cadenceStep + 1, CADENCE_LENGTH);

  let followUpAt: Date | null = null;
  if (!closes) {
    if (outcome === "CALLBACK") {
      followUpAt = new Date(now.getTime() + CALLBACK_HOURS * 60 * 60 * 1000);
    } else if (outcome === "NOT_NOW") {
      followUpAt = new Date(now.getTime() + NOT_NOW_DAYS * 24 * 60 * 60 * 1000);
    } else {
      followUpAt = nextTouchDue(cadenceStep, now);
    }
  }

  await prisma.$transaction([
    prisma.partnerCall.create({
      data: {
        channelPartnerId: partner.id,
        outcome,
        notes: clean(notes, 2000) || null,
        calledBy,
      },
    }),
    prisma.channelPartner.update({
      where: { id: partner.id },
      data: {
        callDisposition: outcome,
        lastCalledAt: now,
        callCount: partner.callCount + 1,
        cadenceStep,
        followUpAt,
        // A prospect who signs up leaves the prospect pipeline and joins the
        // real one. Deliberately not the reverse: a DEAD prospect keeps its
        // status so the row is never silently resurrected by a later edit.
        ...(outcome === "SIGNED_UP" && partner.status === "PROSPECT"
          ? { status: "APPLIED" }
          : {}),
      },
    }),
  ]);

  revalidatePath("/admin/network/recruit");
  return { ok: true };
}

export type AddProspectInput = {
  businessName: string;
  contactName?: string;
  phone: string;
  email?: string;
  trade?: string;
  city?: string;
  state?: string;
  approxListSize?: string;
  notes?: string;
};

/**
 * Add one prospect by hand, between calls.
 *
 * Phone is the identity here, not email: a contractor found on Google Maps has
 * a number and often no address you can reach a person at. Duplicates are
 * refused rather than merged, because two people working the same list should
 * collide loudly.
 */
export async function addProspect(input: AddProspectInput): Promise<RecruitResult> {
  try {
    requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const businessName = clean(input.businessName, 200);
  if (!businessName) return { ok: false, error: "Needs a business name." };

  const phone = toE164(clean(input.phone, 40));
  if (!phone) return { ok: false, error: "That phone number doesn't look right." };

  const existing = await prisma.channelPartner.findFirst({
    where: { phone },
    select: { businessName: true, status: true },
  });
  if (existing) {
    return {
      ok: false,
      error: `Already on the list as ${existing.businessName} (${existing.status.toLowerCase()}).`,
    };
  }

  const email = clean(input.email, 200).toLowerCase() || null;
  if (email) {
    const dupe = await prisma.channelPartner.findUnique({
      where: { email },
      select: { businessName: true },
    });
    if (dupe) return { ok: false, error: `That email is already on ${dupe.businessName}.` };
  }

  const trade = clean(input.trade, 40);
  const state = clean(input.state, 2).toUpperCase();
  const listSize = Number.parseInt(clean(input.approxListSize, 10), 10);

  await prisma.channelPartner.create({
    data: {
      status: "PROSPECT",
      businessName,
      contactName: clean(input.contactName, 120) || "",
      phone,
      email,
      industry: trade && isProspectTrade(trade) ? trade : null,
      city: clean(input.city, 120) || null,
      state: STATE_CODES.has(state) ? state : null,
      approxListSize: Number.isFinite(listSize) && listSize > 0 ? listSize : null,
      notes: clean(input.notes, 2000) || null,
      source: "COLD_CALL",
    },
  });

  revalidatePath("/admin/network/recruit");
  return { ok: true };
}

export type BulkResult =
  | { ok: true; added: number; skipped: number; reasons: string[] }
  | { ok: false; error: string };

const MAX_BULK_ROWS = 500;

/**
 * Paste a block of prospects in one go.
 *
 * One per line, comma or tab separated: business, phone, contact, city. Built
 * for the actual workflow — somebody has a Google Maps search open and is
 * copying rows out of it — rather than for a clean CSV that will never exist.
 * Anything unparseable is reported back by line rather than dropped silently.
 */
export async function addProspectsBulk(
  raw: string,
  defaults: { trade?: string; state?: string },
): Promise<BulkResult> {
  try {
    requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const lines = clean(raw, 100_000)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { ok: false, error: "Nothing to add." };
  if (lines.length > MAX_BULK_ROWS) {
    return { ok: false, error: `That's ${lines.length} lines. Do it in batches of ${MAX_BULK_ROWS}.` };
  }

  const trade = clean(defaults.trade, 40);
  const state = clean(defaults.state, 2).toUpperCase();

  // Everything already on file, so a paste that overlaps last week's paste
  // reports the overlap instead of failing row by row against the database.
  const known = new Set(
    (await prisma.channelPartner.findMany({ select: { phone: true } })).map((p) => p.phone),
  );

  const rows: { businessName: string; phone: string; contactName: string; city: string }[] = [];
  const reasons: string[] = [];
  let skipped = 0;

  lines.forEach((line, i) => {
    const parts = line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((p) => p.trim().replace(/^"|"$/g, ""));
    const businessName = parts[0] ?? "";
    const phone = toE164(parts[1] ?? "");

    if (!businessName) {
      skipped++;
      if (reasons.length < 8) reasons.push(`Line ${i + 1}: no business name.`);
      return;
    }
    if (!phone) {
      skipped++;
      if (reasons.length < 8) reasons.push(`Line ${i + 1}: "${businessName}" has no usable phone.`);
      return;
    }
    if (known.has(phone)) {
      skipped++;
      if (reasons.length < 8) reasons.push(`Line ${i + 1}: "${businessName}" is already on the list.`);
      return;
    }

    known.add(phone);
    rows.push({
      businessName: businessName.slice(0, 200),
      phone,
      contactName: (parts[2] ?? "").slice(0, 120),
      city: (parts[3] ?? "").slice(0, 120),
    });
  });

  if (rows.length > 0) {
    await prisma.channelPartner.createMany({
      data: rows.map((r) => ({
        status: "PROSPECT",
        businessName: r.businessName,
        contactName: r.contactName,
        phone: r.phone,
        industry: trade && isProspectTrade(trade) ? trade : null,
        city: r.city || null,
        state: STATE_CODES.has(state) ? state : null,
        source: "COLD_CALL",
      })),
    });
  }

  revalidatePath("/admin/network/recruit");
  return { ok: true, added: rows.length, skipped, reasons };
}

/** Record what they said their list was, mid-call. It decides if this is worth working. */
export async function setListSize(partnerId: string, size: string): Promise<RecruitResult> {
  try {
    requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const n = Number.parseInt(clean(size, 10), 10);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
    return { ok: false, error: "That's not a number of customers." };
  }

  await prisma.channelPartner.update({
    where: { id: partnerId },
    data: {
      approxListSize: n,
      ...(n > 0 && n < MIN_VIABLE_LIST
        ? { notes: undefined } // left alone; the hub flags small lists on screen
        : {}),
    },
  });

  revalidatePath("/admin/network/recruit");
  return { ok: true };
}
