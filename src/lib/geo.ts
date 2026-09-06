// Geo primitives shared by client and server. Deliberately dependency-free
// and network-free so it's safe to import anywhere — the actual lookups live
// behind /api/geocode and /api/directions.

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

// Roads don't run in straight lines. When the routing service is unreachable
// we still want a usable number rather than a dead quote flow, so scale the
// straight-line distance by a typical street-grid detour factor. It's an
// estimate either way — every quote on this site is confirmed by a dispatcher.
const ROAD_WINDING_FACTOR = 1.3;

export function estimateRoadMiles(a: LatLng, b: LatLng): number {
  return haversineMiles(a, b) * ROAD_WINDING_FACTOR;
}

/** Rough drive time, used only when the routing service doesn't give us one. */
export function estimateDriveMinutes(miles: number): number {
  const AVERAGE_MPH = 28; // surface streets with stops, not freeway cruising
  return (miles / AVERAGE_MPH) * 60;
}

export function isLatLng(value: unknown): value is LatLng {
  if (typeof value !== "object" || value === null) return false;
  const { lat, lng } = value as Record<string, unknown>;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
