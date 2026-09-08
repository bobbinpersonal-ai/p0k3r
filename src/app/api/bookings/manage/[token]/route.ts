import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyOwnerBookingCanceled, notifyOwnerRescheduleRequested } from "@/lib/notify";

// Public by design — no isAdminRequest check. The manageToken in the URL
// (see src/lib/manageToken.ts) is the access control: unguessable, and only
// ever handed to the one customer it belongs to, in their own confirmation
// message.

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { manageToken: params.token } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status === "CANCELED" || booking.status === "COMPLETED") {
    return NextResponse.json(
      { error: "This booking can't be changed anymore — call or text us instead." },
      { status: 409 },
    );
  }

  if (body.action === "cancel") {
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELED" },
    });
    await notifyOwnerBookingCanceled(updated);
    return NextResponse.json({ booking: updated });
  }

  if (body.action === "reschedule_request") {
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!note) {
      return NextResponse.json({ error: "Tell us what you'd like to change." }, { status: 400 });
    }
    // Logged, not applied: the date/window on the row don't move until a
    // dispatcher has actually confirmed the matched crew can make the new
    // time — see ManageActions.tsx.
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        dispatchNotes: [booking.dispatchNotes, `Customer requested reschedule: ${note}`]
          .filter(Boolean)
          .join("\n"),
      },
    });
    await notifyOwnerRescheduleRequested(updated, note);
    return NextResponse.json({ booking: updated });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
