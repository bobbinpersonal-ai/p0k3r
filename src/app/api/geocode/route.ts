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
// Attempts run most precise first:
//   1. Google Geocoding, if GOOGLE_MAPS_API_KEY is set — best US accuracy
//   2. Mapbox, if MAPBOX_TOKEN is set
//   3. the US Census geocoder — free, keyless, no signup, and built on the
//      Census Bureau's own TIGER/Line street data, so its US house-number
//      coverage is far better than the OSM-based autocomplete we fall back
//      to. US-only, which is fine: we only move people in California.
//   4. Photon, as a last network attempt
//
// A tier that's configured but *failing* is skipped rather than fatal, so the
// free tiers still run when Google is down or its billing hasn't gone active.
//   5. any of the above retried with the town appended, since a bare street
//      name is often unresolvable alone but fine once anchored to a city
//   6. the service-area town centre, which still puts the trip on the map
//      and gets the mileage roughly right
//
// `precision` tells the caller which kind of answer landed, so the UI can be
// honest about whether it found a building or just the town.

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

async function geocodeViaGoogle(query: string, key: string): Promise<GeocodeResult | null> {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}` +
    `&components=country:US`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    results?: {
      geometry?: { location?: { lat: number; lng: number }; location_type?: string };
      formatted_address?: string;
    }[];
  };
  const hit = data.results?.[0];
  const location = hit?.geometry?.location;
  if (data.status !== "OK" || !location) return null;
  return {
    lat: location.lat,
    lng: location.lng,
    // APPROXIMATE means Google interpolated to a street or wider area rather
    // than pinning a rooftop, so don't advertise it as an exact address.
    precision: hit?.geometry?.location_type === "APPROXIMATE" ? "city" : "address",
    label: (hit?.formatted_address ?? query).replace(/, USA$/, ""),
  };
}

// The US Census Bureau's own geocoder. No key, no signup, no rate-limit
// paperwork, and its street data is the same TIGER/Line set the government
// uses for the census — which makes it dramatically better at US house
// numbers than the OSM-derived free options. Nothing to configure, so this
// runs for everyone on the no-key path.
async function geocodeViaCensus(query: string): Promise<GeocodeResult | null> {
  const url =
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress` +
    `?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    result?: {
      addressMatches?: { coordinates?: { x: number; y: number }; matchedAddress?: string }[];
    };
  };
  const match = data.result?.addressMatches?.[0];
  const coords = match?.coordinates;
  if (!coords || typeof coords.x !== "number" || typeof coords.y !== "number") return null;
  // Census returns x = longitude, y = latitude.
  return {
    lat: coords.y,
    lng: coords.x,
    precision: "address",
    label: match?.matchedAddress ?? query,
  };
}

async function geocodeViaMapbox(query: string, token: string): Promise<GeocodeResult | null> {
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

async function geocodeViaPhoton(query: string): Promise<GeocodeResult | null> {
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

/**
 * Runs one provider, treating a thrown error — a timeout, DNS failure, or a
 * body that didn't parse — exactly like "no match": null, so the ladder moves
 * on to the next tier instead of collapsing to the town centre.
 */
async function attempt<T>(run: () => Promise<T | null>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

async function geocodeViaProvider(query: string): Promise<GeocodeResult | null> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const token = process.env.MAPBOX_TOKEN;

  // Most accurate first, and every tier runs regardless of what's configured
  // above it. Census in particular is free and keyless, so there's no reason to
  // skip it just because a Google key exists — if Google is down, mid-billing,
  // or over quota, a Census rooftop is a far better answer than dropping the
  // customer's building to the middle of their town.
  return (
    (googleKey ? await attempt(() => geocodeViaGoogle(query, googleKey)) : null) ??
    (token ? await attempt(() => geocodeViaMapbox(query, token)) : null) ??
    (await attempt(() => geocodeViaCensus(query))) ??
    (await attempt(() => geocodeViaPhoton(query)))
  );
}

/**
 * Turn a Google place id into coordinates.
 *
 * Passing the same session token the autocomplete used closes that billing
 * session, so the customer's whole typing burst plus this lookup costs one
 * session instead of one charge per keystroke. Always prefer this over
 * geocoding the text when we have an id.
 */
async function detailsViaGoogle(
  placeId: string,
  key: string,
  sessionToken: string | undefined,
): Promise<GeocodeResult | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}&key=${encodeURIComponent(key)}` +
    `&fields=geometry,formatted_address` +
    (sessionToken ? `&sessiontoken=${encodeURIComponent(sessionToken)}` : "");
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    result?: {
      geometry?: { location?: { lat: number; lng: number } };
      formatted_address?: string;
    };
  };
  const location = data.result?.geometry?.location;
  if (data.status !== "OK" || !location) return null;
  return {
    lat: location.lat,
    lng: location.lng,
    precision: "address",
    label: (data.result?.formatted_address ?? "").replace(/, USA$/, ""),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { placeId, sessionToken } = (body ?? {}) as {
    placeId?: unknown;
    sessionToken?: unknown;
  };
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  // Cheapest and most accurate path: the customer picked a Google suggestion,
  // so we already have an exact place id.
  if (googleKey && typeof placeId === "string" && placeId) {
    try {
      const details = await detailsViaGoogle(
        placeId,
        googleKey,
        typeof sessionToken === "string" ? sessionToken : undefined,
      );
      if (details) return NextResponse.json({ result: details });
    } catch {
      // fall through to resolving the text below
    }
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
