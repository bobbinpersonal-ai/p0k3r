// Launch markets. Add a city here and two pages appear automatically — no
// other code changes needed:
//
//   /movers/<slug>       the moving page, off `blurb`
//   /landscaping/<slug>  the yard page, off `yardBlurb`
//
// Both are required rather than one falling back to the other. A moving blurb
// on a lawn-care page ("student move-outs, apartment turns near campus") is
// worse than no page at all: it reads as a template someone forgot to fill in,
// which is exactly the impression a local-services company can least afford.

export type City = {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  /** The same thing for the landscaping page. What the yards here are like. */
  yardBlurb: string;
  neighborhoods: string[];
  // Hyper-local angle shown as its own section on the city's booking page
  // and (when that city is selected) on the /drive recruiting page.
  community?: {
    heading: string;
    body: string;
  };
};

/**
 * The name with any leading "the" removed.
 *
 * `name` reads correctly after a preposition — "movers in the Bay Area" — but
 * dropped straight into a possessive or a modifier it produces "your the Bay
 * Area move" and "the Bay Area move sizes". Templates in that shape use this.
 */
export function bareCityName(city: City): string {
  return city.name.replace(/^the\s+/i, "");
}

export const CITIES: City[] = [
  {
    slug: "davis",
    name: "Davis",
    region: "Yolo County",
    blurb:
      "Student move-outs, apartment turns near campus, and family moves across town — booked in minutes.",
    yardBlurb:
      "Student rentals with lawns nobody signed up to mow, and long-established gardens on the older streets. Weekly and every-other-week plans across town.",
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
    yardBlurb:
      "Midtown strips, East Sac lawns under the tree canopy, and big Natomas and Elk Grove back yards. Mowing, cleanups and green-waste hauling at a flat price.",
    neighborhoods: ["Midtown", "East Sacramento", "Land Park", "Natomas", "Elk Grove", "Sac State"],
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
    yardBlurb:
      "Small city yards where every inch counts, plus the bigger suburban lots out east. Mowing, hedge trimming and full cleanups, priced before we come out.",
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
    yardBlurb:
      "Valley lawns that grow fast from March through October, plus the overgrown rentals and side yards that need clearing before they can be kept.",
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
    slug: "modesto",
    name: "Modesto",
    region: "Stanislaus County",
    blurb:
      "Local movers for Modesto apartments, Central Valley homes, and single big items — booked in minutes.",
    yardBlurb:
      "Stanislaus County heat means grass that needs a weekly cut half the year. Regular mowing plans, one-off cleanups, and hauling the green waste away.",
    neighborhoods: [
      "Downtown Modesto",
      "College Area",
      "Village One",
      "La Loma",
      "Modesto Junior College area",
    ],
    community: {
      heading: "Staffed by Modesto, for Modesto",
      body: "Our Modesto crews are Central Valley locals — they know the neighborhoods, the summer heat, and how to get a move done without the runaround or the surprise fees.",
    },
  },
  {
    slug: "manteca",
    name: "Manteca",
    region: "San Joaquin County",
    blurb:
      "Local movers for Manteca homes and apartments, plus quick hauls across the 99 corridor — booked in minutes.",
    yardBlurb:
      "Newer subdivisions with front lawns to keep, and older lots with fence lines and shrubs that need cutting back. Both priced by yard size.",
    neighborhoods: ["Downtown Manteca", "Woodward Park", "Union Ranch", "Lathrop", "Ripon"],
    community: {
      heading: "Staffed by Manteca, for Manteca",
      body: "Our Manteca crews live in San Joaquin County and cover the whole 99 corridor — new builds out by Union Ranch, older homes downtown, and everything between.",
    },
  },
  {
    slug: "roseville",
    name: "Roseville",
    region: "Placer County",
    blurb:
      "Local movers for Roseville homes and apartments — Fiddyment Farm, Sun City, and everywhere between.",
    yardBlurb:
      "Newer Placer County subdivisions with front lawns to keep and HOA standards to meet, plus older Roseville lots with hedges and fence lines that need cutting back.",
    neighborhoods: ["Downtown Roseville", "Fiddyment Farm", "Sun City", "Woodcreek", "Diamond Oaks"],
    community: {
      heading: "Staffed by Placer County, for Placer County",
      body: "Our Roseville crews live up here — they know the subdivisions, the HOA expectations, and how fast a Placer County lawn grows once the heat arrives.",
    },
  },
  {
    slug: "elk-grove",
    name: "Elk Grove",
    region: "Sacramento County",
    blurb:
      "Local movers for Elk Grove houses, apartments, and storage runs across south Sacramento — booked in minutes.",
    yardBlurb:
      "Big suburban back yards, side gates and long fence lines. Weekly mowing plans, seasonal cleanups, and mulch or sod when the lawn's had enough.",
    neighborhoods: [
      "Old Town Elk Grove",
      "Laguna West",
      "Laguna Creek",
      "Franklin",
      "Sheldon",
      "Wilton",
    ],
    community: {
      heading: "Staffed by Elk Grove, for Elk Grove",
      body: "Our Elk Grove crews are south Sacramento locals — they know Laguna, Old Town, and the newer builds out toward Sheldon, and they show up ready to work.",
    },
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    region: "Los Angeles County",
    blurb:
      "Movers for LA apartments, hillside homes, and everything from Downtown to the Valley — booked in minutes.",
    yardBlurb:
      "From Valley lawns to hillside slopes and small Westside yards. Mowing, trimming and clearing, with the price on the screen before anyone drives out.",
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
    yardBlurb:
      "Central Valley yards that need a cut most of the year, UC Merced rentals, and the overgrowth that builds up on a vacant lot over a season.",
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
    yardBlurb:
      "Coastal weather keeps things growing year-round here. Regular mowing, hedge work, and clearing yards that have got away over a wet winter.",
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
