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

  const token = process.env.MAPBOX_TOKEN;

  try {
    const route = token
      ? ((await routeViaMapbox(pickup, dropoff, token)) ?? (await routeViaOsrm(pickup, dropoff)))
      : await routeViaOsrm(pickup, dropoff);
    if (route) return NextResponse.json(route);
  } catch {
    // fall through to the straight-line estimate below
  }

  const miles = estimateRoadMiles(pickup, dropoff);
  return NextResponse.json({
    miles,
    minutes: estimateDriveMinutes(miles),
    geometry: [],
    estimated: true,
  } satisfies RouteResult);
}
