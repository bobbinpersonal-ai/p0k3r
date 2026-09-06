// A small gazetteer of the towns we actually serve, Bay Area through the
// Sacramento Valley and down the 99.
//
// This is the last line of defence for mapping a trip. When a customer types
// an address the geocoder can't resolve to a building, we can still almost
// always recognise the town in it — and a Woodland → Sacramento move is about
// twenty miles whichever house it starts at. Falling back to town centres
// gives a route, a distance and a price instead of a shrug, and the UI marks
// the result approximate so nobody mistakes it for a surveyed number.
//
// Coordinates are town centres, to roughly three decimal places. They are not
// precise enough to quote a final price off — a dispatcher confirms that — but
// they are far better than nothing.

export type ServiceAreaPlace = {
  name: string;
  /** Lower-case spellings we'll accept in typed text, including common short forms. */
  aliases: string[];
  lat: number;
  lng: number;
};

export const SERVICE_AREA_PLACES: ServiceAreaPlace[] = [
  // --- Sacramento Valley / our home turf ---
  { name: "Sacramento", aliases: ["sacramento", "sac"], lat: 38.5816, lng: -121.4944 },
  { name: "West Sacramento", aliases: ["west sacramento", "west sac"], lat: 38.5805, lng: -121.5302 },
  { name: "Davis", aliases: ["davis", "uc davis"], lat: 38.5449, lng: -121.7405 },
  { name: "Woodland", aliases: ["woodland"], lat: 38.6785, lng: -121.7733 },
  { name: "Winters", aliases: ["winters"], lat: 38.5249, lng: -121.9708 },
  { name: "Dixon", aliases: ["dixon"], lat: 38.4455, lng: -121.8233 },
  { name: "Elk Grove", aliases: ["elk grove"], lat: 38.4088, lng: -121.3716 },
  { name: "Folsom", aliases: ["folsom"], lat: 38.678, lng: -121.1761 },
  { name: "Roseville", aliases: ["roseville"], lat: 38.7521, lng: -121.288 },
  { name: "Rocklin", aliases: ["rocklin"], lat: 38.7907, lng: -121.2358 },
  { name: "Citrus Heights", aliases: ["citrus heights"], lat: 38.7071, lng: -121.281 },
  { name: "Rancho Cordova", aliases: ["rancho cordova"], lat: 38.5891, lng: -121.3027 },
  { name: "Galt", aliases: ["galt"], lat: 38.2546, lng: -121.2999 },
  { name: "Auburn", aliases: ["auburn"], lat: 38.8966, lng: -121.077 },
  { name: "Yuba City", aliases: ["yuba city"], lat: 39.1404, lng: -121.6169 },
  { name: "Marysville", aliases: ["marysville"], lat: 39.1457, lng: -121.5914 },

  // --- Solano / the corridor between us and the Bay ---
  { name: "Vacaville", aliases: ["vacaville"], lat: 38.3566, lng: -121.9877 },
  { name: "Fairfield", aliases: ["fairfield"], lat: 38.2494, lng: -122.04 },
  { name: "Suisun City", aliases: ["suisun city", "suisun"], lat: 38.2382, lng: -122.0405 },
  { name: "Benicia", aliases: ["benicia"], lat: 38.0494, lng: -122.1586 },
  { name: "Vallejo", aliases: ["vallejo"], lat: 38.1041, lng: -122.2566 },
  { name: "Napa", aliases: ["napa"], lat: 38.2975, lng: -122.2869 },
  { name: "Santa Rosa", aliases: ["santa rosa"], lat: 38.4404, lng: -122.7141 },

  // --- Bay Area ---
  { name: "San Francisco", aliases: ["san francisco", "sf"], lat: 37.7749, lng: -122.4194 },
  { name: "Oakland", aliases: ["oakland"], lat: 37.8044, lng: -122.2712 },
  { name: "Berkeley", aliases: ["berkeley", "uc berkeley"], lat: 37.8715, lng: -122.273 },
  { name: "Richmond", aliases: ["richmond"], lat: 37.9358, lng: -122.3477 },
  { name: "Concord", aliases: ["concord"], lat: 37.978, lng: -122.0311 },
  { name: "Walnut Creek", aliases: ["walnut creek"], lat: 37.9101, lng: -122.0652 },
  { name: "Antioch", aliases: ["antioch"], lat: 38.0049, lng: -121.8058 },
  { name: "Brentwood", aliases: ["brentwood"], lat: 37.9319, lng: -121.6958 },
  { name: "Livermore", aliases: ["livermore"], lat: 37.6819, lng: -121.7681 },
  { name: "Pleasanton", aliases: ["pleasanton"], lat: 37.6624, lng: -121.8747 },
  { name: "Dublin", aliases: ["dublin"], lat: 37.7022, lng: -121.9358 },
  { name: "Hayward", aliases: ["hayward"], lat: 37.6688, lng: -122.0808 },
  { name: "Fremont", aliases: ["fremont"], lat: 37.5485, lng: -121.9886 },
  { name: "San Jose", aliases: ["san jose"], lat: 37.3382, lng: -121.8863 },
  { name: "Santa Clara", aliases: ["santa clara"], lat: 37.3541, lng: -121.9552 },
  { name: "Sunnyvale", aliases: ["sunnyvale"], lat: 37.3688, lng: -122.0363 },
  { name: "Mountain View", aliases: ["mountain view"], lat: 37.3861, lng: -122.0839 },
  { name: "Palo Alto", aliases: ["palo alto"], lat: 37.4419, lng: -122.143 },
  { name: "Redwood City", aliases: ["redwood city"], lat: 37.4852, lng: -122.2364 },
  { name: "San Mateo", aliases: ["san mateo"], lat: 37.563, lng: -122.3255 },
  { name: "Daly City", aliases: ["daly city"], lat: 37.6879, lng: -122.4702 },
  { name: "South San Francisco", aliases: ["south san francisco", "south sf"], lat: 37.6547, lng: -122.4077 },

  // --- Down the 99 / Central Valley ---
  { name: "Lodi", aliases: ["lodi"], lat: 38.1341, lng: -121.2722 },
  { name: "Stockton", aliases: ["stockton"], lat: 37.9577, lng: -121.2908 },
  { name: "Lathrop", aliases: ["lathrop"], lat: 37.8227, lng: -121.2766 },
  { name: "Manteca", aliases: ["manteca"], lat: 37.7974, lng: -121.216 },
  { name: "Ripon", aliases: ["ripon"], lat: 37.7413, lng: -121.1241 },
  { name: "Tracy", aliases: ["tracy"], lat: 37.7397, lng: -121.4252 },
  { name: "Modesto", aliases: ["modesto"], lat: 37.6391, lng: -120.9969 },
  { name: "Turlock", aliases: ["turlock"], lat: 37.4947, lng: -120.8466 },
  { name: "Merced", aliases: ["merced", "uc merced"], lat: 37.3022, lng: -120.4829 },

  // --- Coast + Southern markets we list ---
  { name: "Salinas", aliases: ["salinas"], lat: 36.6777, lng: -121.6555 },
  { name: "Monterey", aliases: ["monterey"], lat: 36.6002, lng: -121.8947 },
  { name: "Los Angeles", aliases: ["los angeles", "la", "l.a."], lat: 34.0522, lng: -118.2437 },
];

/**
 * Find a town we recognise inside a free-text address.
 *
 * Matches on word boundaries so "Lodi" doesn't fire on "Melodie Lane", and
 * prefers the longest alias so "West Sacramento" wins over "Sacramento" and
 * "South San Francisco" over "San Francisco".
 */
export function findServiceAreaPlace(address: string): ServiceAreaPlace | null {
  const haystack = address.toLowerCase();

  const matches: { place: ServiceAreaPlace; length: number }[] = [];
  for (const place of SERVICE_AREA_PLACES) {
    for (const alias of place.aliases) {
      // Escape regex metacharacters (aliases like "l.a." contain them).
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "i").test(haystack)) {
        matches.push({ place, length: alias.length });
      }
    }
  }

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.length - a.length);
  return matches[0].place;
}
