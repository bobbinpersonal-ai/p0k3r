import { NextResponse } from "next/server";
import { haversineMiles, isLatLng } from "@/lib/geo";
import { SERVICE_AREA_PLACES } from "@/lib/serviceAreaPlaces";

// Coordinates -> city and ZIP. Nothing finer.
//
// This backs the "use my location" button. The browser hands us a precise fix,
// but a moving quote only needs the town and the ZIP, so that is all we ask
// for, all we return, and all that ever reaches a field the customer sees.
// Two reasons, and the second is the important one:
//
//   1. Accuracy. A GPS fix indoors is routinely off by a building or more, so
//      a reverse-geocoded street address is a guess presented as a fact. The
//      customer would have to check it anyway — and might not.
//   2. Restraint. Someone tapping a convenience button hasn't asked us to
//      record where they are standing. City and ZIP fill the form; the street
//      is theirs to type.
//
// Coordinates are rounded before they leave us — see ROUNDING in POST.

export const runtime = "nodejs";

const TIMEOUT_MS = 3500;

export type ReverseResult = {
  city: string;
  zip: string;
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

async function attempt<T>(run: () => Promise<T | null>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

function firstZip(value: unknown): string {
  const match = /\b(\d{5})\b/.exec(String(value ?? ""));
  return match ? match[1] : "";
}

async function viaGoogle(lat: number, lng: number, key: string): Promise<ReverseResult | null> {
  const res = await fetchWithTimeout(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
      `&result_type=locality|postal_code&key=${encodeURIComponent(key)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    results?: { address_components?: { long_name?: string; types?: string[] }[] }[];
  };
  if (data.status !== "OK") return null;

  let city = "";
  let zip = "";
  for (const result of data.results ?? []) {
    for (const part of result.address_components ?? []) {
      if (!city && part.types?.includes("locality")) city = part.long_name ?? "";
      if (!zip && part.types?.includes("postal_code")) zip = firstZip(part.long_name);
    }
  }
  return city || zip ? { city, zip } : null;
}

async function viaMapbox(lat: number, lng: number, token: string): Promise<ReverseResult | null> {
  const res = await fetchWithTimeout(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=postcode,place&limit=2&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: { place_type?: string[]; text?: string }[];
  };
  const city = data.features?.find((f) => f.place_type?.includes("place"))?.text ?? "";
  const zip = firstZip(data.features?.find((f) => f.place_type?.includes("postcode"))?.text);
  return city || zip ? { city, zip } : null;
}

/**
 * The Census Bureau's own point-to-geography lookup. Free, keyless, and
 * authoritative for US ZIPs — it answers with the ZCTA (the Census's ZIP-code
 * area) and the incorporated place, which is exactly the granularity we want
 * and no more.
 *
 * Group names in the response vary by vintage, so match them by pattern rather
 * than hard-coding a key that a vintage bump would silently break.
 */
async function viaCensus(lat: number, lng: number): Promise<ReverseResult | null> {
  const res = await fetchWithTimeout(
    `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current` +
      `&layers=all&format=json`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    result?: { geographies?: Record<string, Record<string, unknown>[]> };
  };
  const groups = data.result?.geographies;
  if (!groups) return null;

  let city = "";
  let zip = "";
  for (const [name, entries] of Object.entries(groups)) {
    const entry = entries?.[0];
    if (!entry) continue;
    if (!zip && /zip code tabulation/i.test(name)) {
      zip = firstZip(entry.ZCTA5CE20 ?? entry.ZCTA5 ?? entry.BASENAME ?? entry.NAME);
    }
    if (!city && /incorporated place|census designated place/i.test(name)) {
      city = String(entry.BASENAME ?? entry.NAME ?? "");
    }
  }
  // Unincorporated addresses have no "place"; the county subdivision is the
  // next best thing a customer would recognise as their town.
  if (!city) {
    for (const [name, entries] of Object.entries(groups)) {
      if (/county subdivision/i.test(name) && entries?.[0]) {
        city = String(entries[0].BASENAME ?? entries[0].NAME ?? "");
        break;
      }
    }
  }
  return city || zip ? { city, zip } : null;
}

async function viaPhoton(lat: number, lng: number): Promise<ReverseResult | null> {
  const res = await fetchWithTimeout(
    `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1&lang=en`,
    { headers: { "User-Agent": "LoveMeAfter/1.0 (moving booking site)" } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: {
      properties?: { city?: string; town?: string; village?: string; postcode?: string };
    }[];
  };
  const props = data.features?.[0]?.properties;
  if (!props) return null;
  const city = props.city ?? props.town ?? props.village ?? "";
  const zip = firstZip(props.postcode);
  return city || zip ? { city, zip } : null;
}

/**
 * Last resort: the nearest town we actually serve. No ZIP — we'd be inventing
 * one — but naming the town is still most of the value, and it keeps the
 * button from doing nothing when every geocoder is unreachable.
 */
function nearestServiceAreaTown(lat: number, lng: number): ReverseResult | null {
  let best: { name: string; miles: number } | null = null;
  for (const place of SERVICE_AREA_PLACES) {
    const miles = haversineMiles({ lat, lng }, { lat: place.lat, lng: place.lng });
    if (!best || miles < best.miles) best = { name: place.name, miles };
  }
  // Beyond this the "nearest" town is a wild guess and worse than saying
  // nothing — they're outside the service area anyway.
  if (!best || best.miles > 25) return null;
  return { city: best.name, zip: "" };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const point = (body ?? {}) as { lat?: unknown; lng?: unknown };
  if (!isLatLng(point)) {
    return NextResponse.json({ error: "Need numeric lat/lng." }, { status: 400 });
  }

  // ROUNDING: three decimal places is about 110 metres — far finer than a ZIP
  // boundary needs, and coarse enough that we aren't forwarding which building
  // someone is standing in to a third-party geocoder.
  const lat = Math.round(point.lat * 1000) / 1000;
  const lng = Math.round(point.lng * 1000) / 1000;

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const token = process.env.MAPBOX_TOKEN;

  const result =
    (googleKey ? await attempt(() => viaGoogle(lat, lng, googleKey)) : null) ??
    (token ? await attempt(() => viaMapbox(lat, lng, token)) : null) ??
    (await attempt(() => viaCensus(lat, lng))) ??
    (await attempt(() => viaPhoton(lat, lng))) ??
    nearestServiceAreaTown(lat, lng);

  return NextResponse.json({ result });
}
