// Launch markets. Add a city here and a page appears at /movers/<slug>
// automatically — no other code changes needed.

export type City = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  neighborhoods: string[];
};

export const CITIES: City[] = [
  {
    slug: "davis",
    name: "Davis",
    region: "Yolo County",
    blurb:
      "Student move-outs, apartment turns near campus, and family moves across town — booked in minutes.",
    neighborhoods: ["Downtown Davis", "East Davis", "West Davis", "UC Davis campus"],
  },
  {
    slug: "sacramento",
    name: "Sacramento",
    region: "Sacramento County",
    blurb:
      "Local movers for Midtown apartments, suburban houses, and everything in between the greater Sacramento area.",
    neighborhoods: ["Midtown", "East Sacramento", "Land Park", "Natomas", "Elk Grove"],
  },
  {
    slug: "bay-area",
    name: "the Bay Area",
    region: "San Francisco Bay Area",
    blurb:
      "Movers who know Bay Area buildings — walk-ups, tight street parking, and elevator reservations included.",
    neighborhoods: ["San Francisco", "Oakland", "San Jose", "Berkeley", "Peninsula"],
  },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
