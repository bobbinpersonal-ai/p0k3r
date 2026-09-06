import { NextResponse } from "next/server";
import { estimateDriveMinutes, estimateRoadMiles, isLatLng, type LatLng } from "@/lib/geo";

// Drive distance/duration between pickup and drop-off, plus the route shape to
// draw on the map.
//
// Same provider ladder as /api/places: Mapbox when MAPBOX_TOKEN is set,
// otherwise the public OSRM instance, which needs no key.
//
// Unlike autocomplete, this one never returns "nothing" — the quote depends on
// it. If both providers fail we fall back to a straight-line estimate scaled
// for street detours (see estimateRoadMiles) and say so via `estimated: true`,
// so the UI can be honest that the number is approximate.

export const runtime = "nodejs";

const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const METERS_PER_MILE = 1609.34;

type RouteResult = {
  miles: number;
  minutes: number;
  /** [lng, lat] pairs for the polyline, empty when we only have an estimate. */
  geometry: [number, number][];
  estimated: boolean;
};

type OsrmLikeResponse = {
  routes?: { distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] } }[];
};

function parseRouteResponse(data: OsrmLikeResponse): RouteResult | null {
  const route = data.routes?.[0];
  if (!route || typeof route.distance !== "number" || typeof route.duration !== "number") {
    return null;
  }
  return {
    miles: route.distance / METERS_PER_MILE,
    minutes: route.duration / 60,
    geometry: route.geometry?.coordinates ?? [],
    estimated: false,
  };
}

/** Google encodes route shapes as a polyline string rather than coordinates. */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    for (const axis of ["lat", "lng"] as const) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === "lat") lat += delta;
      else lng += delta;
    }
    // GeoJSON order, matching what the map component expects.
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

async function routeViaGoogle(a: LatLng, b: LatLng, key: string): Promise<RouteResult | null> {
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}` +
    `&mode=driving&key=${encodeURIComponent(key)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    routes?: {
      overview_polyline?: { points?: string };
      legs?: { distance?: { value?: number }; duration?: { value?: number } }[];
    }[];
  };
  const route = data.routes?.[0];
  const leg = route?.legs?.[0];
  if (data.status !== "OK" || !leg?.distance?.value || !leg?.duration?.value) return null;

  return {
    miles: leg.distance.value / METERS_PER_MILE,
    minutes: leg.duration.value / 60,
    geometry: route?.overview_polyline?.points
      ? decodePolyline(route.overview_polyline.points)
      : [],
    estimated: false,
  };
}

async function routeViaMapbox(a: LatLng, b: LatLng, token: string) {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  return parseRouteResponse((await res.json()) as OsrmLikeResponse);
}

async function routeViaOsrm(a: LatLng, b: LatLng) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${a.lng},${a.lat};${b.lng},${b.lat}` +
    `?geometries=geojson&overview=full`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  return parseRouteResponse((await res.json()) as OsrmLikeResponse);
}

/**
 * Runs one router, treating a thrown error — a timeout, DNS failure, or a body
 * that didn't parse — like a refusal: null, so the ladder moves on. Sharing one
 * try block would mean a Google timeout skipping OSRM and drawing a dashed
 * straight line when a real road route was one call away.
 */
async function attempt(run: () => Promise<RouteResult | null>): Promise<RouteResult | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { pickup, dropoff } = (body ?? {}) as { pickup?: unknown; dropoff?: unknown };
  if (!isLatLng(pickup) || !isLatLng(dropoff)) {
    return NextResponse.json(
      { error: "Both pickup and dropoff need numeric lat/lng." },
      { status: 400 },
    );
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const token = process.env.MAPBOX_TOKEN;

  // Best available first, then down the ladder — each step also covers the one
  // above it failing, not just being unconfigured.
  const route =
    (googleKey ? await attempt(() => routeViaGoogle(pickup, dropoff, googleKey)) : null) ??
    (token ? await attempt(() => routeViaMapbox(pickup, dropoff, token)) : null) ??
    (await attempt(() => routeViaOsrm(pickup, dropoff)));
  if (route) return NextResponse.json(route);

  // Every router is unreachable: quote off a straight line scaled for street
  // detours and flag it, rather than dead-ending a booking on a map failure.
  const miles = estimateRoadMiles(pickup, dropoff);
  return NextResponse.json({
    miles,
    minutes: estimateDriveMinutes(miles),
    geometry: [],
    estimated: true,
  } satisfies RouteResult);
}
