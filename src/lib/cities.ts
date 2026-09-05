// Launch markets. Add a city here and a page appears at /movers/<slug>
// automatically — no other code changes needed.

export type City = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  neighborhoods: string[];
  // Optional hyper-local angle shown as its own section on the city page —
  // only set this where it's actually true for that market.
  community?: {
    heading: string;
    body: string;
  };
};

export const CITIES: City[] = [
  {
    slug: "davis",
    name: "Davis",
    region: "Yolo County",
    blurb:
      "Student move-outs, apartment turns near campus, and family moves across town — booked in minutes.",
    neighborhoods: ["Downtown Davis", "East Davis", "West Davis", "UC Davis campus"],
    community: {
      heading: "Staffed by Davis, for Davis",
      body: "Our Davis crews are UC Davis students and long-time locals — people who already know the dorms, the bike routes, and what June move-out chaos actually looks like. We started this company after working the other side of this job ourselves: it's good, honest work when it's run right, and it's better for everyone when the crew actually knows the town.",
    },
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
  {
    slug: "stockton",
    name: "Stockton",
    region: "San Joaquin County",
    blurb:
      "Local movers for Stockton apartments, Central Valley homes, and everything in between — booked in minutes.",
    neighborhoods: [
      "Downtown Stockton",
      "Lincoln Village",
      "Brookside",
      "Weston Ranch",
      "University of the Pacific area",
    ],
  },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
