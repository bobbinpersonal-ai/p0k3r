import { NextRequest, NextResponse } from "next/server";
import { estimateYard } from "@/lib/parcel";

/**
 * "Roughly how big is the yard at these coordinates?"
 *
 * Always 200. A null estimate is the normal answer for an uncovered county, a
 * slow parcel service, or a geocode that landed on a town centre — the booking
 * flow treats it as "ask them", which is what it did before this existed, so
 * there's nothing here worth surfacing to the customer as an error.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ estimate: null }, { status: 200 });
  }

  const estimate = await estimateYard(lat, lng).catch(() => null);
  return NextResponse.json({ estimate }, { status: 200 });
}
