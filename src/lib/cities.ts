// Launch markets. Add a city here and a page appears at /movers/<slug>
// automatically — no other code changes needed.

export type City = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  neighborhoods: string[];
  // Hyper-local angle shown as its own section on the city's booking page
  // and (when that city is selected) on the /drive recruiting page.
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
    community: {
      heading: "Staffed by Sacramento, for Sacramento",
      body: "Our Sacramento crews live in the neighborhoods they serve — Midtown, East Sac, Natomas, Elk Grove — so they know the parking, the stairs, and the shortcuts. Real local movers, not a call center dispatching strangers.",
    },
  },
  {
    slug: "bay-area",
    name: "the Bay Area",
    region: "San Francisco Bay Area",
    blurb:
      "Movers who know Bay Area buildings — walk-ups, tight street parking, and elevator reservations included.",
    neighborhoods: [
      "San Francisco",
      "Oakland",
      "San Jose",
      "UC Berkeley",
      "Saint Mary's College",
      "Peninsula",
    ],
    community: {
      heading: "Staffed by the Bay, for the Bay",
      body: "Bay Area moves come with narrow streets, walk-ups, and elevator reservations — our crews live here and deal with it every day, so nothing about your building surprises them.",
    },
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
    community: {
      heading: "Staffed by Stockton, for Stockton",
      body: "Our Stockton crews are local — people who know the Central Valley heat, the neighborhoods, and how to get your move done without the runaround.",
    },
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    region: "Los Angeles County",
    blurb:
      "Movers for LA apartments, hillside homes, and everything from Downtown to the Valley — booked in minutes.",
    neighborhoods: [
      "Downtown LA",
      "Hollywood",
      "Silver Lake",
      "Santa Monica",
      "San Fernando Valley",
      "Westwood / UCLA",
      "USC",
    ],
    community: {
      heading: "Staffed by LA, for LA",
      body: "From Downtown high-rises to Valley houses, LA moves are never one-size-fits-all. Our crews live in the city and know how to handle its traffic, parking, and buildings.",
    },
  },
  {
    slug: "merced",
    name: "Merced",
    region: "Merced County",
    blurb:
      "Local movers for Merced apartments, Central Valley homes, and UC Merced move-ins and move-outs.",
    neighborhoods: ["Downtown Merced", "UC Merced", "North Merced", "Bear Creek"],
    community: {
      heading: "Staffed by Merced, for Merced",
      body: "Our Merced crews know the Central Valley — from UC Merced student housing to family homes across town — and treat every move like it's for a neighbor, because it usually is.",
    },
  },
  {
    slug: "salinas",
    name: "Salinas",
    region: "Monterey County",
    blurb:
      "Local movers for Salinas homes and apartments, from Downtown to the Alisal — booked in minutes.",
    neighborhoods: ["Downtown Salinas", "Alisal", "Northridge", "Harden Ranch"],
    community: {
      heading: "Staffed by Salinas, for Salinas",
      body: "Our Salinas crews are local to the Central Coast — they know the Alisal, Downtown, and everywhere in between, and show up ready to work, not just passing through.",
    },
  },
];

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}
