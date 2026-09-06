import { NextResponse } from "next/server";
import type { PlaceSuggestion } from "@/lib/geo";

// Address autocomplete for the quote step.
//
// Providers in order of accuracy, picked by whichever key is configured:
//   GOOGLE_MAPS_API_KEY → Google Places Autocomplete. The best US address
//                         coverage there is, and what Uber/Lugg use. Returns
//                         descriptions without coordinates; picking one is
//                         resolved through /api/geocode, which also means we
//                         pay for one geocode per booking rather than one per
//                         keystroke.
//   MAPBOX_TOKEN        → Mapbox geocoding, coordinates included in one call.
//   neither             → Photon, keyless and signup-free, so the flow works
//                         on a fresh deploy. Its US street coverage is thin —
//                         this is the tier to move off once you're spending on
//                         ads (see /api/geocode, which backstops it).
//
// Each tier also covers the one above it *failing*, not just being
// unconfigured. That matters most on the day a key is first added: a Google key
// whose billing hasn't gone active yet answers REQUEST_DENIED, and without the
// fall-through, setting the env var would take autocomplete from "working on
// Photon" to "returns nothing" — a config change silently making the site
// worse. A provider that fails is skipped; only a provider that genuinely has
// no matches ends the search.
//
// Autocomplete is an enhancement, never a gate: if every provider is down, slow,
// or rate-limiting us, we return an empty list and the customer just types their
// address by hand. The booking still goes through.

export const runtime = "nodejs";

const TIMEOUT_MS = 3500;

// Bias results toward where we actually operate rather than the whole planet.
const CALIFORNIA_CENTER = { lat: 37.5, lng: -120.5 };

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type GooglePrediction = {
  description?: string;
  place_id?: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
};

/** Returns null when Google couldn't answer, [] when it has no matches. */
async function searchGoogle(
  query: string,
  key: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[] | null> {
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}` +
    `&components=country:us&types=address` +
    // Bias toward the service area without hard-excluding anything outside it.
    `&location=${CALIFORNIA_CENTER.lat},${CALIFORNIA_CENTER.lng}&radius=250000` +
    // Billing: with a session token, every keystroke in one typing burst plus
    // the Place Details lookup that follows is charged as a single session
    // rather than per request.
    (sessionToken ? `&sessiontoken=${encodeURIComponent(sessionToken)}` : "");

  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: string;
    error_message?: string;
    predictions?: GooglePrediction[];
  };
  // REQUEST_DENIED means the key is missing the Places API, missing billing, or
  // restricted away from this caller; OVER_QUERY_LIMIT means we've been cut off.
  // Either way Google can't answer, so hand back null and let the next provider
  // try. Logged because this is the failure someone has to be able to diagnose
  // from the Vercel logs after wiring up a key — the query itself is a fragment
  // of a customer's address, so it stays out of the log line.
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.warn(
      `[places] Google autocomplete unavailable: ${data.status}` +
        (data.error_message ? ` — ${data.error_message}` : ""),
    );
    return null;
  }

  return (data.predictions ?? []).slice(0, 5).flatMap((prediction) => {
    const primary = prediction.structured_formatting?.main_text ?? prediction.description ?? "";
    if (!primary) return [];
    return [
      {
        primary,
        secondary: (prediction.structured_formatting?.secondary_text ?? "").replace(/, USA$/, ""),
        full: (prediction.description ?? primary).replace(/, USA$/, ""),
        // Coordinates come later, from Place Details on the picked place id.
        lat: null,
        lng: null,
        placeId: prediction.place_id,
      },
    ];
  });
}

type MapboxFeature = {
  place_name?: string;
  text?: string;
  address?: string;
  center?: [number, number];
  context?: { id: string; text: string; short_code?: string }[];
};

/** Returns null when Mapbox couldn't answer, [] when it has no matches. */
async function searchMapbox(query: string, token: string): Promise<PlaceSuggestion[] | null> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${encodeURIComponent(token)}` +
    `&autocomplete=true&limit=5&country=us&types=address,poi` +
    `&proximity=${CALIFORNIA_CENTER.lng},${CALIFORNIA_CENTER.lat}`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: MapboxFeature[] };

  return (data.features ?? []).flatMap((feature) => {
    if (!feature.center) return [];
    const [lng, lat] = feature.center;
    const streetLine = [feature.address, feature.text].filter(Boolean).join(" ");
    const place = feature.context?.find((c) => c.id.startsWith("place"))?.text;
    const region = feature.context?.find((c) => c.id.startsWith("region"));
    const regionCode = region?.short_code?.replace("US-", "") ?? region?.text;

    return [
      {
        primary: streetLine || feature.text || "",
        secondary: [place, regionCode].filter(Boolean).join(", "),
        full: feature.place_name ?? streetLine,
        lat,
        lng,
      },
    ];
  });
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
};

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  California: "CA",
  Nevada: "NV",
  Oregon: "OR",
  Arizona: "AZ",
};

// Photon ranks worldwide by default, so "1710 Lee Ct" happily returns a street
// in Belgium above the one down the road. Constraining to a California
// bounding box and asking for address-level layers first is most of what makes
// the keyless results usable.
const CALIFORNIA_BBOX = "-124.5,32.5,-114.1,42.1"; // minLon,minLat,maxLon,maxLat

async function searchPhoton(query: string): Promise<PlaceSuggestion[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
    `&limit=8&lang=en&bbox=${CALIFORNIA_BBOX}` +
    `&lat=${CALIFORNIA_CENTER.lat}&lon=${CALIFORNIA_CENTER.lng}` +
    `&layer=house&layer=street&layer=locality`;

  const res = await fetchWithTimeout(url, {
    // Photon's usage policy asks that clients identify themselves.
    headers: { "User-Agent": "LoveMeAfter/1.0 (moving booking site)" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };

  const scored = (data.features ?? []).flatMap((feature) => {
    const coords = feature.geometry?.coordinates;
    const props = feature.properties;
    if (!coords || !props) return [];
    if (props.countrycode && props.countrycode !== "US") return [];

    const [lng, lat] = coords;
    const street = [props.housenumber, props.street].filter(Boolean).join(" ");
    const primary = street || props.name || "";
    if (!primary) return [];

    const state = props.state ? (US_STATE_ABBREVIATIONS[props.state] ?? props.state) : undefined;
    const secondary = [props.city, state].filter(Boolean).join(", ");

    return [
      {
        // People type house numbers, so a result that actually has one is
        // almost always the one they meant — float those above bare streets.
        rank: props.housenumber ? 0 : props.street ? 1 : 2,
        suggestion: {
          primary,
          secondary,
          full: [primary, secondary].filter(Boolean).join(", "),
          lat,
          lng,
        },
      },
    ];
  });

  return scored
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .map((s) => s.suggestion);
}

/**
 * Runs one provider, treating a thrown error — a timeout, DNS failure, or a
 * body that didn't parse — exactly like a refusal: null, so the ladder moves
 * on. Without this the tiers share a single try block, and a Google timeout
 * would skip the fallbacks it exists to reach.
 */
async function attempt(
  run: () => Promise<PlaceSuggestion[] | null>,
): Promise<PlaceSuggestion[] | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const sessionToken = params.get("session") ?? undefined;

  // Below three characters every provider just returns noise.
  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const token = process.env.MAPBOX_TOKEN;

  // `??` rather than a ternary chain: a configured provider that fails falls
  // through to the next one instead of ending the search empty-handed.
  const suggestions =
    (googleKey ? await attempt(() => searchGoogle(query, googleKey, sessionToken)) : null) ??
    (token ? await attempt(() => searchMapbox(query, token)) : null) ??
    (await attempt(() => searchPhoton(query))) ??
    // Everything is down. The customer types their address by hand and the
    // booking still goes through — /api/geocode resolves it on Continue.
    [];

  return NextResponse.json({ suggestions });
}
