"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDisposition } from "@/lib/regions/dispositions";
import { COMPANY } from "@/lib/regions/brand";
import { sendIntroduction } from "@/lib/notify";
import { PENDING_INTRO, WARMED, introMessage, mayDial } from "@/lib/regions/warmup";

// The desk's writes.
//
// Server Actions rather than API routes, and this is the only place in the
// codebase that uses them. The desk is a person burning through a call list at
// speed: an action plus revalidatePath is one round trip where fetch plus
// router.refresh() is two, and at fifty dials an hour that difference is the
// whole feel of the tool.
//
// isAdminRequest() takes a NextRequest and there isn't one here, so the guard
// reads the same cookie through next/headers. Same secret, same validator —
// see src/lib/auth.ts.

function requireAdmin() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Not authorised.");
  }
}

export type DeskResult = { ok: true } | { ok: false; error: string };

/**
 * Record what a call did.
 *
 * Writes two things: a CallAttempt, which is the permanent log and carries the
 * lead's own local time — that is the curfew defence and it has to be
 * answerable years later — and the denormalised latest on the lead, so the
 * queue is one indexed read.
 */
export async function setDisposition(
  leadId: string,
  value: string,
  calledBy = "desk",
): Promise<DeskResult> {
  try {
    requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const disposition = getDisposition(value);
  if (!disposition || value === "NEW") {
    return { ok: false, error: "Not an outcome we know." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      status: true,
      warmupStatus: true,
      channelPartner: { select: { warmupTrack: true } },
    },
  });
  if (!lead) return { ok: false, error: "Lead not found." };

  // The gate, enforced here rather than left to the button being disabled.
  // A disabled button is a suggestion; this is the rule. DEAD is exempt —
  // somebody who has asked not to be contacted can always be recorded as
  // such, whether or not we ever introduced ourselves.
  if (
    value !== "DEAD" &&
    !mayDial(lead.channelPartner?.warmupTrack, lead.warmupStatus, Boolean(lead.channelPartner))
  ) {
    return {
      ok: false,
      error: "This one hasn't been introduced yet. Send the intro before you dial.",
    };
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.callAttempt.create({
      data: {
        leadId: lead.id,
        calledBy,
        outcome: disposition.value,
        // The lead's local time is what the curfew rule is measured in. Until
        // the queue carries a timezone per lead this is server time, which is
        // honest but not yet the defence it needs to be.
        localTime: now,
      },
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        callDisposition: disposition.value,
        lastCalledAt: now,
        callCount: { increment: 1 },
        // A dead lead is dead in the pipeline too, or it sits in the job list
        // forever waiting for a crew who is never going.
        ...(disposition.value === "DEAD" && lead.status !== "SOLD" && lead.status !== "COMPLETED"
          ? { status: "DEAD" }
          : {}),
      },
    }),
  ]);

  revalidatePath("/admin/desk");
  return { ok: true };
}


/**
 * Send the warm introduction, and unlock the dialer if it actually went.
 *
 * The order matters. The lead is marked PENDING_INTRO first, so two operators
 * pressing the button at once do not both send; it moves to WARMED only on a
 * channel that reported success, and falls back to UNWARMED if nothing did.
 * Marking somebody warmed on a message that never arrived is worse than
 * leaving them in the queue, because the desk then rings a stranger who was
 * promised a heads-up.
 */
export async function sendWarmIntro(leadId: string, sentBy = "desk"): Promise<DeskResult> {
  try {
    requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      warmupStatus: true,
      channelPartner: { select: { businessName: true, warmupTrack: true } },
    },
  });
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!lead.channelPartner) {
    return { ok: false, error: "No partner behind this one, so there is nobody to introduce." };
  }
  if (lead.warmupStatus === WARMED) return { ok: true };
  if (lead.warmupStatus === PENDING_INTRO) {
    return { ok: false, error: "Already going out. Give it a second." };
  }
  if (!lead.customerPhone && !lead.customerEmail) {
    return { ok: false, error: "No phone or email on this one — nothing to send to." };
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { warmupStatus: PENDING_INTRO },
  });

  const content = introMessage({
    customerName: lead.customerName,
    partnerName: lead.channelPartner.businessName,
    companyName: COMPANY.name,
    companyPhone: COMPANY.phone,
  });

  const sent = await sendIntroduction(
    { phone: lead.customerPhone, email: lead.customerEmail },
    content,
  );

  if (!sent.sms && !sent.email) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { warmupStatus: "UNWARMED" },
    });
    return {
      ok: false,
      error: "Nothing sent — check the number and the email, or whether SMS is switched on.",
    };
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { warmupStatus: WARMED, introSentAt: new Date(), introSentBy: sentBy },
  });

  revalidatePath("/admin/desk");
  return { ok: true };
}
