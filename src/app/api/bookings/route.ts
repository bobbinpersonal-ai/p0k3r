import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMoveSizeValue, getEstimateForMoveSize } from "@/lib/moveSizes";
import { isVehicleTierValue, quoteForTier } from "@/lib/vehicleTiers";
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
    needsHelper,
    details,
    city,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    distanceMiles,
    vehicleTier,
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

  if (typeof needsHelper !== "boolean") {
    return NextResponse.json(
      { error: "Please let us know if you need an extra helper." },
      { status: 400 }
    );
  }

  const parsedDate = new Date(moveDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid move date." }, { status: 400 });
  }

  // Coordinates and distance are optional extras from the map quote flow —
  // accept them only when they're actually numbers, so a malformed client
  // payload can't write junk into dispatch's view of the job.
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
  const tier = typeof vehicleTier === "string" && isVehicleTierValue(vehicleTier) ? vehicleTier : null;

  // The customer sees a tier-adjusted price on the quote cards; store that same
  // number rather than the bare move-size range, so what dispatch reads back
  // matches what the customer was actually shown.
  const { estimateLow, estimateHigh } = tier
    ? (() => {
        const quoted = quoteForTier(moveSize, num(distanceMiles), tier);
        return quoted
          ? { estimateLow: quoted.low, estimateHigh: quoted.high }
          : getEstimateForMoveSize(moveSize);
      })()
    : getEstimateForMoveSize(moveSize);

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
      needsHelper,
      details: typeof details === "string" && details ? details : null,
      city: typeof city === "string" && getCity(city) ? city : null,
      estimateLow,
      estimateHigh,
      pickupLat: num(pickupLat),
      pickupLng: num(pickupLng),
      dropoffLat: num(dropoffLat),
      dropoffLng: num(dropoffLng),
      distanceMiles: num(distanceMiles),
      vehicleTier: tier,
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
