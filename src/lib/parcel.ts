// Guessing how big someone's yard is from their address.
//
// Read this before trusting the number it returns.
//
// County assessors publish parcel polygons — including lot area — as public
// ArcGIS services, so "look up the lot from an address" is genuinely possible.
// What it is NOT is a measurement of the yard:
//
//   1. A lot includes the house, the driveway, the patio and the garage. A
//      6,000 sq ft lot with a 1,800 sq ft footprint has maybe 3,000 sq ft of
//      grass once the hardscape is out. So lot area is an upper bound, and the
//      building area has to come off it — which the parcel record sometimes
//      carries and sometimes doesn't.
//   2. It depends on the geocode landing on the right building. Our own
//      geocoder (see /api/geocode) frequently returns city-centroid precision
//      for a perfectly valid address — and a centroid matches either no parcel
//      or, worse, somebody else's.
//   3. Apartments, condos and mobile home parks resolve to one parcel for the
//      whole complex, which says nothing about the patch of grass being quoted.
//
// The failure mode matters because of what this business promises. A flat
// price with no site visit is the entire pitch; a quote built on the wrong
// parcel is a price that has to change at the gate, which is the one thing
// that promise exists to prevent.
//
// So this is deliberately an ESTIMATE THAT PRE-FILLS A QUESTION, never a
// silent input to a price. The customer always sees the suggested size and
// confirms or changes it — they're standing in the yard, and they win every
// disagreement. If a lookup fails, times out, or the county isn't covered,
// the flow is unchanged: they pick their size the way they always have.

import type { YardSizeValue } from "@/lib/landscaping";

/** Where a county publishes its parcels, and what it calls the fields. */
type CountySource = {
  county: string;
  /** ArcGIS FeatureServer layer that accepts a point query. */
  url: string;
  /** Field holding lot area, and what unit it's in. */
  areaField: string;
  areaUnit: "acres" | "sqft";
  /** Field holding building/improvement area, when the county publishes one. */
  buildingField?: string;
};

/**
 * The counties our service area actually covers.
 *
 * Deliberately a short, explicit list rather than a national provider: these
 * are free and public, and an address outside them simply gets no estimate,
 * which is a fine outcome. Endpoints are the counties' own published open-data
 * services and do change — a broken one shows up as "no estimate", never as a
 * wrong one, because of the sanity bounds in toYardSize below.
 */
const COUNTY_SOURCES: CountySource[] = [
  {
    county: "Sacramento",
    url: "https://services1.arcgis.com/5NARefyPVtAeuJPU/ArcGIS/rest/services/Parcels/FeatureServer/0",
    areaField: "Shape__Area",
    areaUnit: "sqft",
  },
  {
    county: "San Joaquin",
    url: "https://services2.arcgis.com/S1RCC0Bo6cgYGKvw/ArcGIS/rest/services/Parcels/FeatureServer/0",
    areaField: "ACRES",
    areaUnit: "acres",
  },
  {
    county: "Stanislaus",
    url: "https://services1.arcgis.com/6ZFcRqAKvbYcpXTn/ArcGIS/rest/services/Parcels/FeatureServer/0",
    areaField: "ACRES",
    areaUnit: "acres",
  },
];

const SQFT_PER_ACRE = 43_560;

/**
 * Fraction of a lot that is house, driveway, patio and shed on a typical
 * suburban parcel, used when the county doesn't publish a building area.
 *
 * Set high on purpose. Overestimating the yard prices a job we then have to
 * argue about; underestimating it puts the customer in a smaller bucket than
 * they need, and the crew finds out on arrival — but that direction is
 * recoverable and, more to the point, the customer sees the suggestion and can
 * push it up before anyone drives out.
 */
const HARDSCAPE_FRACTION = 0.45;

export type YardEstimate = {
  /** Serviceable yard area we think they have, in square feet. */
  yardSqft: number;
  /** The bucket that maps to, for pre-selecting the size question. */
  yardSize: YardSizeValue;
  /** Total parcel area, so the UI can show its working. */
  lotSqft: number;
  county: string;
};

/**
 * Which size bucket an area falls in.
 *
 * Bounds match the areaHint copy on YARD_SIZES so the suggestion and the card
 * the customer reads can't disagree. Anything absurd — a rounding artifact, a
 * commercial parcel, an apartment complex — returns null rather than a guess,
 * which is what keeps a broken county endpoint from producing a confident
 * wrong answer.
 */
export function toYardSize(yardSqft: number): YardSizeValue | null {
  if (!Number.isFinite(yardSqft) || yardSqft < 100) return null;
  // Past about an acre of actual yard this stops being a residential job and
  // starts being a quote someone should look at.
  if (yardSqft > 40_000) return null;
  if (yardSqft <= 2_000) return "SMALL";
  if (yardSqft <= 6_000) return "MEDIUM";
  if (yardSqft <= 12_000) return "LARGE";
  return "XL";
}

/** One county's parcel service, asked what's at this point. */
async function queryCounty(
  source: CountySource,
  lat: number,
  lng: number,
  signal: AbortSignal,
): Promise<YardEstimate | null> {
  const params = new URLSearchParams({
    f: "json",
    geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: [source.areaField, source.buildingField].filter(Boolean).join(","),
    returnGeometry: "false",
    resultRecordCount: "1",
  });

  const res = await fetch(`${source.url}/query?${params.toString()}`, { signal });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    features?: { attributes?: Record<string, unknown> }[];
  };
  const attributes = body.features?.[0]?.attributes;
  if (!attributes) return null;

  const rawArea = Number(attributes[source.areaField]);
  if (!Number.isFinite(rawArea) || rawArea <= 0) return null;

  const lotSqft = source.areaUnit === "acres" ? rawArea * SQFT_PER_ACRE : rawArea;

  const buildingSqft = source.buildingField ? Number(attributes[source.buildingField]) : NaN;
  const yardSqft =
    Number.isFinite(buildingSqft) && buildingSqft > 0 && buildingSqft < lotSqft
      ? lotSqft - buildingSqft
      : lotSqft * (1 - HARDSCAPE_FRACTION);

  const yardSize = toYardSize(yardSqft);
  if (!yardSize) return null;

  return {
    yardSqft: Math.round(yardSqft),
    yardSize,
    lotSqft: Math.round(lotSqft),
    county: source.county,
  };
}

/**
 * Best guess at the yard behind a set of coordinates, or null.
 *
 * Null is a completely normal answer — an uncovered county, a slow service, a
 * geocode that landed on a town centre — and every caller has to treat it as
 * "ask them" rather than as an error. The whole thing is bounded to a couple
 * of seconds because it sits in the middle of a booking flow: an estimate that
 * arrives late is worth less than the question it was trying to save.
 */
export async function estimateYard(lat: number, lng: number): Promise<YardEstimate | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_500);

  try {
    // The counties don't overlap, so the first one that recognises the point
    // is the answer. Run them together rather than in sequence — a county
    // that's down shouldn't add its timeout to everyone else's wait.
    const results = await Promise.all(
      COUNTY_SOURCES.map((source) =>
        queryCounty(source, lat, lng, controller.signal).catch(() => null),
      ),
    );
    return results.find((result): result is YardEstimate => result !== null) ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Exposed for the unit test. */
export const PARCEL_CONSTANTS = { HARDSCAPE_FRACTION, SQFT_PER_ACRE, COUNTY_SOURCES };
