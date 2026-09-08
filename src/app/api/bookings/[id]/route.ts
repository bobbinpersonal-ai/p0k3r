import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import {
  notifyCustomerCrewConfirmed,
  notifyCustomerReviewRequest,
  notifyDriverAssigned,
} from "@/lib/notify";

const VALID_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELED"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data: {
    status?: string;
    driverId?: string | null;
    dispatchNotes?: string | null;
    reviewRequestSentAt?: Date;
  } = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status;
  }

  if (body.driverId !== undefined) {
    data.driverId = body.driverId === null ? null : String(body.driverId);
  }

  if (body.dispatchNotes !== undefined) {
    data.dispatchNotes = body.dispatchNotes === null ? null : String(body.dispatchNotes);
  }

  // Read the pre-update row so notifications fire on actual transitions, not
  // on every PATCH — the dashboard's status and driver selects each send
  // their own request, and dispatch notes get edited long after a job wraps.
  const existing = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const justAssignedDriver =
    typeof data.driverId === "string" && data.driverId !== existing.driverId;
  const justCompleted = data.status === "COMPLETED" && existing.status !== "COMPLETED";
  if (justCompleted && !existing.reviewRequestSentAt) {
    data.reviewRequestSentAt = new Date();
  }

  const booking = await prisma.booking.update({
    where: { id: params.id },
    data,
    include: { driver: true },
  });

  const notifications: Promise<void>[] = [];
  if (justAssignedDriver && booking.driver) {
    notifications.push(notifyDriverAssigned(booking), notifyCustomerCrewConfirmed(booking));
  }
  if (justCompleted && data.reviewRequestSentAt) {
    notifications.push(notifyCustomerReviewRequest(booking));
  }
  await Promise.all(notifications);

  return NextResponse.json(booking);
}
