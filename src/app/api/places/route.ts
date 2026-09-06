import { NextResponse } from "next/server";
import type { PlaceSuggestion } from "@/lib/geo";

// Address autocomplete for the quote step.
//
// Two providers, picked by whether a token is configured:
//   MAPBOX_TOKEN set → Mapbox geocoding (production path — one request returns
//                      both the formatted address and its coordinates, and the
//                      free tier covers far more lookups than we'll make)
//   otherwise        → Photon, which is keyless and needs no signup, so the
//                      flow works on a fresh deploy with nothing configured
//
// Autocomplete is an enhancement, never a gate: if a provider is down, slow, or
// rate-limiting us, we return an empty list and the customer just types their
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

type MapboxFeature = {
  place_name?: string;
  text?: string;
  address?: string;
  center?: [number, number];
  context?: { id: string; text: string; short_code?: string }[];
};

async function searchMapbox(query: string, token: string): Promise<PlaceSuggestion[]> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${encodeURIComponent(token)}` +
    `&autocomplete=true&limit=5&country=us&types=address,poi` +
    `&proximity=${CALIFORNIA_CENTER.lng},${CALIFORNIA_CENTER.lat}`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
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

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  // Below three characters every provider just returns noise.
  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const token = process.env.MAPBOX_TOKEN;

  try {
    const suggestions = token ? await searchMapbox(query, token) : await searchPhoton(query);
    return NextResponse.json({ suggestions });
  } catch {
    // Timed out, blocked, or malformed upstream response — fall back to
    // free-text entry rather than surfacing an error the customer can't act on.
    return NextResponse.json({ suggestions: [] });
  }
}
