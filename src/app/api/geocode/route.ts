import { NextResponse } from "next/server";
import { findServiceAreaPlace } from "@/lib/serviceAreaPlaces";

// Resolve a typed address to coordinates.
//
// This runs when someone types an address without picking one of the
// autocomplete suggestions — which happens constantly, either because they
// typed the whole thing before the dropdown caught up or because the geocoder
// didn't have their building. Previously that meant no coordinates, so the
// booking flow skipped the map and the mileage entirely.
//
// Three attempts, most precise first:
//   1. the geocoding provider (Mapbox with a token, otherwise Photon)
//   2. the same provider again, with the town appended if we recognise one —
//      "1710 Lee Ct" alone is ambiguous, "1710 Lee Ct, Woodland, CA" is not
//   3. the service-area town centre, which at least puts the trip on the map
//      and gets the mileage roughly right
//
// `precision` tells the caller which one landed, so the UI can be honest.

export const runtime = "nodejs";

const TIMEOUT_MS = 3500;
const CALIFORNIA_CENTER = { lat: 37.5, lng: -120.5 };
const CALIFORNIA_BBOX = "-124.5,32.5,-114.1,42.1";

export type GeocodeResult = {
  lat: number;
  lng: number;
  /** "address" = a real building; "city" = town centre fallback. */
  precision: "address" | "city";
  label: string;
};

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeViaProvider(query: string): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_TOKEN;

  if (token) {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${encodeURIComponent(token)}&limit=1&country=us` +
      `&proximity=${CALIFORNIA_CENTER.lng},${CALIFORNIA_CENTER.lat}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: { center?: [number, number]; place_name?: string }[];
    };
    const hit = data.features?.[0];
    if (!hit?.center) return null;
    return {
      lng: hit.center[0],
      lat: hit.center[1],
      precision: "address",
      label: hit.place_name ?? query,
    };
  }

  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
    `&limit=1&lang=en&bbox=${CALIFORNIA_BBOX}`;
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "LoveMeAfter/1.0 (moving booking site)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: {
      geometry?: { coordinates?: [number, number] };
      properties?: Record<string, string | undefined>;
    }[];
  };
  const hit = data.features?.[0];
  const coords = hit?.geometry?.coordinates;
  if (!coords) return null;
  const props = hit?.properties ?? {};
  const label =
    [props.housenumber, props.street].filter(Boolean).join(" ") || props.name || query;
  return { lng: coords[0], lat: coords[1], precision: "address", label };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const address = String((body as { address?: unknown })?.address ?? "").trim();
  if (address.length < 3) {
    return NextResponse.json({ result: null });
  }

  const town = findServiceAreaPlace(address);

  try {
    const direct = await geocodeViaProvider(address);
    if (direct) return NextResponse.json({ result: direct });

    // Retry with the town spelled out — a bare street name is often
    // unresolvable on its own but fine once it's anchored to a city.
    if (town && !new RegExp(town.name, "i").test(address)) {
      const anchored = await geocodeViaProvider(`${address}, ${town.name}, CA`);
      if (anchored) return NextResponse.json({ result: anchored });
    }
  } catch {
    // fall through to the town centre
  }

  if (town) {
    return NextResponse.json({
      result: {
        lat: town.lat,
        lng: town.lng,
        precision: "city",
        label: `${town.name}, CA`,
      } satisfies GeocodeResult,
    });
  }

  return NextResponse.json({ result: null });
}
