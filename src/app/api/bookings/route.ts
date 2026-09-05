import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMoveSizeValue, getEstimateForMoveSize } from "@/lib/moveSizes";
import { isServiceTypeValue } from "@/lib/serviceTypes";
import { isAdminRequest } from "@/lib/auth";
import { getCity } from "@/lib/cities";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    pickupAddress,
    dropoffAddress,
    moveDate,
    timeWindow,
    moveSize,
    serviceType,
    serviceTypeOther,
    details,
    city,
  } = body;

  const requiredFields: Record<string, unknown> = {
    customerName,
    customerPhone,
    pickupAddress,
    dropoffAddress,
    moveDate,
    timeWindow,
    moveSize,
  };
  for (const [field, value] of Object.entries(requiredFields)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  if (!isMoveSizeValue(moveSize)) {
    return NextResponse.json({ error: "Invalid move size." }, { status: 400 });
  }

  if (typeof serviceType !== "string" || !isServiceTypeValue(serviceType)) {
    return NextResponse.json(
      { error: "Please tell us what kind of service you need." },
      { status: 400 }
    );
  }

  if (
    serviceType === "OTHER" &&
    (typeof serviceTypeOther !== "string" || serviceTypeOther.trim().length === 0)
  ) {
    return NextResponse.json(
      { error: "Please describe what you need help with." },
      { status: 400 }
    );
  }

  const parsedDate = new Date(moveDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid move date." }, { status: 400 });
  }

  const { estimateLow, estimateHigh } = getEstimateForMoveSize(moveSize);

  const booking = await prisma.booking.create({
    data: {
      customerName,
      customerPhone,
      customerEmail: typeof customerEmail === "string" && customerEmail ? customerEmail : null,
      pickupAddress,
      dropoffAddress,
      moveDate: parsedDate,
      timeWindow,
      moveSize,
      serviceType,
      serviceTypeOther: serviceType === "OTHER" ? serviceTypeOther : null,
      details: typeof details === "string" && details ? details : null,
      city: typeof city === "string" && getCity(city) ? city : null,
      estimateLow,
      estimateHigh,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { driver: true },
  });

  return NextResponse.json(bookings);
}
