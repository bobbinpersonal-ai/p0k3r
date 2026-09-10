import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMoveSizeValue } from "@/lib/moveSizes";
import { isVehicleTierValue } from "@/lib/vehicleTiers";
import { quoteForTier } from "@/lib/pricing";
import { isServiceTypeValue } from "@/lib/serviceTypes";
import { getDropoffMode, requiresDropoffAddress } from "@/lib/dropoffModes";
import { isAdminRequest } from "@/lib/auth";
import { getCity } from "@/lib/cities";
import { notifyCustomerBookingConfirmed, notifyNewBooking } from "@/lib/notify";
import { generateManageToken } from "@/lib/manageToken";
import { isSourceValue } from "@/lib/sources";
import { depositFor } from "@/lib/deposit";
import { isPaidMethod, isPaymentMethodValue } from "@/lib/payments";
import { DEFAULT_SERVICE_LINE, isServiceLineValue } from "@/lib/serviceLines";
import {
  DEFAULT_FREQUENCY,
  isFrequencyValue,
  isLandscapingServiceValue,
  isYardSizeValue,
  quoteLandscaping,
  type ServiceCatalogue,
} from "@/lib/landscaping";
import { loadCatalogue } from "@/lib/loadCatalogue";
import type { Prisma } from "@prisma/client";

/**
 * One endpoint, three businesses.
 *
 * A yard job and a move share a customer, an address, a date and a time
 * window, and nothing else: one is priced flat by yard size, the other from
 * hours and miles. Rather than one validator full of "unless it's landscaping",
 * the shared half is checked here and each line brings its own builder for the
 * fields only it uses. Whichever runs, the result is one Booking row that
 * dispatch, the manage link, and the notifications all read the same way.
 */

/**
 * The columns POST fills in for every job, whichever line it belongs to.
 * Subtracted from what a builder returns, so the two halves can't both claim
 * the same column and quietly disagree about it.
 */
type SharedColumn =
  | "customerName"
  | "customerPhone"
  | "customerEmail"
  | "moveDate"
  | "timeWindow"
  | "details"
  | "city"
  | "source"
  | "pickupLat"
  | "pickupLng"
  | "manageToken"
  | "depositAmount"
  | "depositMethod"
  | "depositPaidAt";

/** Either the line-specific columns to write, or the error to send back. */
type BuildResult =
  | { ok: true; data: Omit<Prisma.BookingUncheckedCreateInput, SharedColumn> }
  | { ok: false; error: string };

const missing = (field: string) => `Missing required field: ${field}`;

function isFilled(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Coordinates and distance are optional extras from the map quote flow —
 * accepted only when they're actually numbers, so a malformed client payload
 * can't write junk into dispatch's view of the job.
 */
const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

// --- Moving and junk: priced from hours and miles ----------------------------

function buildMoveBooking(body: Record<string, unknown>): BuildResult {
  const {
    pickupAddress,
    dropoffAddress,
    moveSize,
    serviceType,
    serviceTypeOther,
    needsHelper,
    dropoffMode,
    distanceMiles,
    driveMinutes,
    vehicleTier,
  } = body;

  // Anything unrecognised is treated as a normal two-address move, which is the
  // stricter reading — it still demands a drop-off below.
  const mode =
    (typeof dropoffMode === "string" ? getDropoffMode(dropoffMode) : undefined) ?? "ADDRESS";

  // Only a real move needs somewhere to go. For the others the client sends a
  // label describing the job, and an empty one shouldn't fail the booking.
  if (requiresDropoffAddress(mode) && !isFilled(dropoffAddress)) {
    return { ok: false, error: missing("dropoffAddress") };
  }

  if (!isFilled(moveSize)) return { ok: false, error: missing("moveSize") };
  if (!isMoveSizeValue(moveSize)) return { ok: false, error: "Invalid move size." };

  if (typeof serviceType !== "string" || !isServiceTypeValue(serviceType)) {
    return { ok: false, error: "Please tell us what kind of service you need." };
  }

  if (serviceType === "OTHER" && !isFilled(serviceTypeOther)) {
    return { ok: false, error: "Please describe what you need help with." };
  }

  if (typeof needsHelper !== "boolean") {
    return { ok: false, error: "Please let us know if you need an extra helper." };
  }

  const tier =
    typeof vehicleTier === "string" && isVehicleTierValue(vehicleTier) ? vehicleTier : null;

  // Price through the same model the quote cards used, off the same distance
  // and drive time, so what dispatch reads back is what the customer was shown.
  // A booking with no tier picked is priced as a cargo van, the middle option.
  const quoted = quoteForTier(
    moveSize,
    { miles: num(distanceMiles), minutes: num(driveMinutes) },
    tier ?? "VAN",
    // The extra helper is part of what the customer was quoted, so it has to be
    // part of what dispatch reads back.
    { extraHelper: needsHelper === true },
  );

  return {
    ok: true,
    data: {
      serviceLine: serviceType === "JUNK_REMOVAL" ? "JUNK" : "MOVING",
      pickupAddress: String(pickupAddress),
      dropoffAddress: isFilled(dropoffAddress) ? dropoffAddress.trim() : null,
      dropoffMode: mode,
      moveSize,
      serviceType,
      serviceTypeOther: serviceType === "OTHER" ? String(serviceTypeOther) : null,
      needsHelper,
      estimateLow: quoted?.low ?? 0,
      estimateHigh: quoted?.high ?? 0,
      dropoffLat: num(body.dropoffLat),
      dropoffLng: num(body.dropoffLng),
      distanceMiles: num(distanceMiles),
      vehicleTier: tier,
    },
  };
}

// --- Landscaping: one flat price per (service x yard size) -------------------

function buildLandscapingBooking(
  body: Record<string, unknown>,
  catalogue: ServiceCatalogue,
): BuildResult {
  const { landscapingService, yardSize, frequency, pickupAddress } = body;

  // Checked against the catalogue in force right now, not the one in the
  // source: a service added at /admin/services this morning has to be
  // bookable this afternoon, and one switched off has to stop being.
  if (!isFilled(landscapingService) || !isLandscapingServiceValue(landscapingService, catalogue)) {
    return { ok: false, error: "Please pick which yard service you need." };
  }
  if (!isFilled(yardSize) || !isYardSizeValue(yardSize)) {
    return { ok: false, error: "Please tell us roughly how big the yard is." };
  }

  // An unrecognised cadence books as a one-off rather than failing: the price
  // it produces is the higher one, so a garbled value can never undercharge.
  const requested =
    isFilled(frequency) && isFrequencyValue(frequency) ? frequency : DEFAULT_FREQUENCY;

  const quote = quoteLandscaping(landscapingService, yardSize, requested, catalogue);
  if (!quote) return { ok: false, error: "We don't offer that combination yet." };

  return {
    ok: true,
    data: {
      serviceLine: "LANDSCAPING",
      // The property is the whole job. There is no second address and no route,
      // so the fields that describe one stay null rather than holding a
      // placeholder dispatch would have to learn to ignore.
      pickupAddress: String(pickupAddress),
      dropoffAddress: null,
      dropoffMode: null,
      landscapingService,
      // Frozen at the point of sale — the catalogue can be renamed later.
      landscapingServiceLabel: quote.service.label,
      yardSize,
      // What the quote actually settled on, not what was asked for — a
      // one-time-only service asked for weekly comes back as ONE_TIME.
      frequency: quote.frequency.value,
      // Flat pricing has no range, so both ends hold the per-visit price and
      // every existing "$low–$high" reader collapses to one number on its own.
      estimateLow: quote.perVisit,
      estimateHigh: quote.perVisit,
    },
  };
}

/**
 * The deposit fields, taken from a trusted request.
 *
 * The amount is not believed as sent: it's recomputed from the price this
 * booking was just quoted, so a typo — or a stale form left open through a
 * price change — can't write a figure the confirmation would then present to
 * the customer as their receipt. What the caller actually decides is whether
 * money moved and how.
 */
function readDeposit(body: Record<string, unknown>, price: number) {
  const method = body.depositMethod;
  if (typeof method !== "string" || !isPaymentMethodValue(method) || !isPaidMethod(method)) {
    return null;
  }
  return {
    depositAmount: depositFor(price),
    depositMethod: method,
    depositPaidAt: new Date(),
  };
}

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
    moveDate,
    timeWindow,
    details,
    city,
    pickupLat,
    pickupLng,
    source,
    serviceLine,
  } = body;

  // Everything every job has, whichever business it belongs to.
  const requiredFields: Record<string, unknown> = {
    customerName,
    customerPhone,
    pickupAddress,
    moveDate,
    timeWindow,
  };
  for (const [field, value] of Object.entries(requiredFields)) {
    if (!isFilled(value)) {
      return NextResponse.json({ error: missing(field) }, { status: 400 });
    }
  }

  // A bare "YYYY-MM-DD" is parsed as UTC midnight, which reads back as the
  // previous day anywhere west of Greenwich — a move booked for Sunday would
  // show up in dispatch as Saturday and a crew would arrive a day early. Pin
  // date-only values to local noon instead, which is far enough from either
  // midnight to survive DST shifts.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.exec(String(moveDate));
  const parsedDate = dateOnly ? new Date(`${moveDate}T12:00:00`) : new Date(moveDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid move date." }, { status: 400 });
  }

  // Unrecognised (or absent, on every booking taken before the landscaping
  // pivot) means a move — the same reading the schema default takes.
  const line =
    typeof serviceLine === "string" && isServiceLineValue(serviceLine)
      ? serviceLine
      : DEFAULT_SERVICE_LINE;

  const built =
    line === "LANDSCAPING"
      ? buildLandscapingBooking(body, await loadCatalogue())
      : buildMoveBooking(body);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }

  // A deposit is only ever recorded by someone signed in — the door-knock form
  // (see /admin/knock), which is the only place money changes hands before the
  // booking exists. Taking this from a public payload would let anyone book a
  // job marked paid for, so an unauthenticated request that sends it is not
  // rejected, just ignored: the booking is still real, it simply has no
  // deposit on it.
  const deposit = isAdminRequest(req) ? readDeposit(body, built.data.estimateHigh) : null;

  const booking = await prisma.booking.create({
    data: {
      customerName,
      customerPhone,
      customerEmail: isFilled(customerEmail) ? customerEmail : null,
      moveDate: parsedDate,
      timeWindow,
      details: isFilled(details) ? details : null,
      city: typeof city === "string" && getCity(city) ? city : null,
      source: typeof source === "string" && isSourceValue(source) ? source : null,
      pickupLat: num(pickupLat),
      pickupLng: num(pickupLng),
      manageToken: generateManageToken(),
      ...deposit,
      ...built.data,
    },
  });

  // Fire-and-forget from the customer's perspective, but awaited here so the
  // send actually completes before this serverless function exits — a
  // notification failure never fails the booking (see notify.ts).
  const manageUrl = new URL(`/manage/${booking.manageToken}`, req.nextUrl.origin).toString();
  const agreementUrl = new URL(
    `/agreement/${booking.manageToken}`,
    req.nextUrl.origin,
  ).toString();
  await Promise.all([
    notifyNewBooking(booking),
    notifyCustomerBookingConfirmed(booking, manageUrl, agreementUrl),
  ]);

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
