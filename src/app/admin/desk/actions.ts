"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDisposition } from "@/lib/regions/dispositions";

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
    select: { id: true, status: true },
  });
  if (!lead) return { ok: false, error: "Lead not found." };

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
