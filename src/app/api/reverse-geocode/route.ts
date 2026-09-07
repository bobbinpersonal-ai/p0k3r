import { NextResponse } from "next/server";
import { haversineMiles, isLatLng } from "@/lib/geo";
import { SERVICE_AREA_PLACES } from "@/lib/serviceAreaPlaces";

// Coordinates -> the fullest address we can stand behind.
//
// This backs the "use my location" button. It used to stop at city and ZIP
// because a GPS fix indoors can be off by a building, and a wrong house number
// presented as a fact is worse than a blank field. That was the right caution
// but the wrong lever: the phone tells us how good its fix is, so we can decide
// per request instead of assuming the worst every time.
//
//   accuracy <=  60m  -> house number and street (a good outdoor GPS fix)
//   accuracy <= 150m  -> street name only; the number would be a coin flip,
//                        but a street is long enough to still be right
//   worse             -> town and ZIP, as before (desktop wifi, deep indoors)
//
// Whatever comes back lands in editable fields the customer sees before
// anything is priced, and the button says which of the three happened, so a
// coarse fix reads as "add your street" rather than a silently wrong address.
//
// Coordinates are rounded to the precision the answer actually needs — see
// ROUNDING in POST.

export const runtime = "nodejs";

const TIMEOUT_MS = 3500;

export type ReverseResult = {
  /** House number and street, street alone, or "" when the fix was too coarse. */
  street: string;
  city: string;
  zip: string;
  /** What we're claiming: a building, a street, or just the town. */
  precision: "address" | "street" | "area";
};

/** Below this, a reverse-geocoded house number is worth trusting. */
const HOUSE_NUMBER_ACCURACY_M = 60;
/** Below this the street is probably right even if the number isn't. */
const STREET_ACCURACY_M = 150;

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

/** What a provider can tell us. Assembled into a ReverseResult in POST. */
type ReverseParts = {
  houseNumber?: string;
  street?: string;
  city?: string;
  zip?: string;
};

async function viaGoogle(lat: number, lng: number, key: string): Promise<ReverseParts | null> {
  const res = await fetchWithTimeout(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}` +
      `&key=${encodeURIComponent(key)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    results?: { address_components?: { long_name?: string; types?: string[] }[] }[];
  };
  if (data.status !== "OK") return null;

  const parts: ReverseParts = {};
  for (const result of data.results ?? []) {
    for (const part of result.address_components ?? []) {
      const types = part.types ?? [];
      if (!parts.houseNumber && types.includes("street_number")) parts.houseNumber = part.long_name;
      if (!parts.street && types.includes("route")) parts.street = part.long_name;
      if (!parts.city && types.includes("locality")) parts.city = part.long_name;
      if (!parts.zip && types.includes("postal_code")) parts.zip = firstZip(part.long_name);
    }
  }
  return Object.keys(parts).length ? parts : null;
}

async function viaMapbox(lat: number, lng: number, token: string): Promise<ReverseParts | null> {
  const res = await fetchWithTimeout(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?types=address,postcode,place&limit=3&access_token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: { place_type?: string[]; text?: string; address?: string }[];
  };
  const address = data.features?.find((f) => f.place_type?.includes("address"));
  return {
    houseNumber: address?.address,
    street: address?.text,
    city: data.features?.find((f) => f.place_type?.includes("place"))?.text,
    zip: firstZip(data.features?.find((f) => f.place_type?.includes("postcode"))?.text),
  };
}

/**
 * The Census Bureau's point-to-geography lookup. Free, keyless, and
 * authoritative for US ZIPs — it answers with the ZCTA (the Census's ZIP-code
 * area) and the incorporated place. It has no street-level reverse endpoint,
 * which is why POST merges it with Photon rather than picking one.
 *
 * Group names in the response vary by vintage, so they are matched by pattern
 * rather than a hard-coded key a vintage bump would silently break.
 */
async function viaCensus(lat: number, lng: number): Promise<ReverseParts | null> {
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

  const parts: ReverseParts = {};
  for (const [name, entries] of Object.entries(groups)) {
    const entry = entries?.[0];
    if (!entry) continue;
    if (!parts.zip && /zip code tabulation/i.test(name)) {
      parts.zip = firstZip(entry.ZCTA5CE20 ?? entry.ZCTA5 ?? entry.BASENAME ?? entry.NAME);
    }
    if (!parts.city && /incorporated place|census designated place/i.test(name)) {
      parts.city = String(entry.BASENAME ?? entry.NAME ?? "");
    }
  }
  // Unincorporated addresses have no "place"; the county subdivision is the
  // next best thing a customer would recognise as their town.
  if (!parts.city) {
    for (const [name, entries] of Object.entries(groups)) {
      if (/county subdivision/i.test(name) && entries?.[0]) {
        parts.city = String(entries[0].BASENAME ?? entries[0].NAME ?? "");
        break;
      }
    }
  }
  return parts.city || parts.zip ? parts : null;
}

/** OSM data via Photon — the only keyless source that knows house numbers. */
async function viaPhoton(lat: number, lng: number): Promise<ReverseParts | null> {
  const res = await fetchWithTimeout(
    `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1&lang=en`,
    { headers: { "User-Agent": "LoveMeAfter/1.0 (moving booking site)" } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    features?: {
      properties?: {
        housenumber?: string;
        street?: string;
        name?: string;
        city?: string;
        town?: string;
        village?: string;
        postcode?: string;
      };
    }[];
  };
  const props = data.features?.[0]?.properties;
  if (!props) return null;
  return {
    houseNumber: props.housenumber,
    // Photon puts the road in `street` when there's a house number and in
    // `name` when the nearest feature is the road itself.
    street: props.street ?? (props.housenumber ? undefined : props.name),
    city: props.city ?? props.town ?? props.village,
    zip: firstZip(props.postcode),
  };
}

/**
 * Last resort: the nearest town we actually serve. No ZIP — we'd be inventing
 * one — but naming the town is still most of the value, and it keeps the
 * button from doing nothing when every geocoder is unreachable.
 */
function nearestServiceAreaTown(lat: number, lng: number): ReverseParts | null {
  let best: { name: string; miles: number } | null = null;
  for (const place of SERVICE_AREA_PLACES) {
    const miles = haversineMiles({ lat, lng }, { lat: place.lat, lng: place.lng });
    if (!best || miles < best.miles) best = { name: place.name, miles };
  }
  // Beyond this the "nearest" town is a wild guess and worse than saying
  // nothing — they're outside the service area anyway.
  if (!best || best.miles > 25) return null;
  return { city: best.name };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (body ?? {}) as { lat?: unknown; lng?: unknown; accuracy?: unknown };
  // Read before the type guard: isLatLng narrows to exactly lat/lng.
  const reported = raw.accuracy;
  const point = raw;
  if (!isLatLng(point)) {
    return NextResponse.json({ error: "Need numeric lat/lng." }, { status: 400 });
  }

  // How good the phone says its fix is, in metres. Missing or nonsense is
  // treated as the worst case rather than the best.
  const accuracy =
    typeof reported === "number" && Number.isFinite(reported) && reported > 0
      ? reported
      : Number.POSITIVE_INFINITY;

  const wantsStreet = accuracy <= STREET_ACCURACY_M;
  const wantsHouseNumber = accuracy <= HOUSE_NUMBER_ACCURACY_M;

  // ROUNDING: only as precise as the answer needs. Five decimals (~1m) to find
  // a house number, three (~110m) when we're only naming the town — no reason
  // to hand a third-party geocoder a doorstep to answer a question about a ZIP.
  const factor = wantsStreet ? 1e5 : 1e3;
  const lat = Math.round(point.lat * factor) / factor;
  const lng = Math.round(point.lng * factor) / factor;

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const token = process.env.MAPBOX_TOKEN;

  let parts: ReverseParts | null =
    (googleKey ? await attempt(() => viaGoogle(lat, lng, googleKey)) : null) ??
    (token ? await attempt(() => viaMapbox(lat, lng, token)) : null);

  if (!parts) {
    // No paid provider. Neither free source answers the whole question — the
    // Census knows the authoritative ZIP but no streets, Photon knows streets
    // but its US postcodes are patchy — so ask both and take the best of each.
    const [area, fine] = await Promise.all([
      attempt(() => viaCensus(lat, lng)),
      wantsStreet ? attempt(() => viaPhoton(lat, lng)) : Promise.resolve(null),
    ]);
    if (area || fine) {
      parts = {
        houseNumber: fine?.houseNumber,
        street: fine?.street,
        city: area?.city || fine?.city,
        zip: area?.zip || fine?.zip,
      };
    }
  }

  parts = parts ?? nearestServiceAreaTown(lat, lng);
  if (!parts) return NextResponse.json({ result: null });

  // Only claim as much as the fix supports.
  const houseNumber = wantsHouseNumber ? (parts.houseNumber ?? "") : "";
  const street = wantsStreet ? (parts.street ?? "") : "";
  const streetLine = [houseNumber, street].filter(Boolean).join(" ").trim();

  const result: ReverseResult = {
    street: streetLine,
    city: parts.city ?? "",
    zip: parts.zip ?? "",
    precision: houseNumber && street ? "address" : streetLine ? "street" : "area",
  };

  if (!result.street && !result.city && !result.zip) {
    return NextResponse.json({ result: null });
  }
  return NextResponse.json({ result });
}
