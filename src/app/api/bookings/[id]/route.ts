import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";

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

  const booking = await prisma.booking.update({
    where: { id: params.id },
    data,
    include: { driver: true },
  });

  return NextResponse.json(booking);
}
