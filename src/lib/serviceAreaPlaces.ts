// A small gazetteer of the towns we actually serve, Bay Area through the
// Sacramento Valley and down the 99.
//
// This is the last line of defence for mapping a trip. When a customer types
// an address the geocoder can't resolve to a building, we can still almost
// always recognise the town in it — and a Woodland → Sacramento move is about
// twenty miles whichever house it starts at. Falling back to town centers
// gives a route, a distance and a price instead of a shrug, and the UI marks
// the result approximate so nobody mistakes it for a surveyed number.
//
// Coordinates are town centers, to roughly three decimal places. They are not
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

  // --- Bay Area, the core cities ---
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

  // --- East Bay infill — the cities between the ones already listed ---
  { name: "Alameda", aliases: ["alameda"], lat: 37.7652, lng: -122.2416 },
  { name: "San Leandro", aliases: ["san leandro"], lat: 37.7249, lng: -122.1561 },
  { name: "Castro Valley", aliases: ["castro valley"], lat: 37.6941, lng: -122.0863 },
  { name: "Union City", aliases: ["union city"], lat: 37.5934, lng: -122.0438 },
  { name: "Newark", aliases: ["newark"], lat: 37.5297, lng: -122.0402 },
  { name: "Danville", aliases: ["danville"], lat: 37.8216, lng: -121.9999 },
  { name: "San Ramon", aliases: ["san ramon"], lat: 37.7799, lng: -121.978 },
  { name: "Martinez", aliases: ["martinez"], lat: 38.0194, lng: -122.1341 },
  { name: "Pittsburg", aliases: ["pittsburg"], lat: 38.028, lng: -121.8847 },
  { name: "Pinole", aliases: ["pinole"], lat: 38.0044, lng: -122.2989 },
  { name: "San Pablo", aliases: ["san pablo"], lat: 37.9622, lng: -122.3455 },
  { name: "El Cerrito", aliases: ["el cerrito"], lat: 37.9155, lng: -122.3108 },

  // --- Peninsula infill ---
  { name: "Burlingame", aliases: ["burlingame"], lat: 37.5779, lng: -122.365 },
  { name: "San Bruno", aliases: ["san bruno"], lat: 37.6305, lng: -122.4111 },
  { name: "Millbrae", aliases: ["millbrae"], lat: 37.5985, lng: -122.3872 },
  { name: "Foster City", aliases: ["foster city"], lat: 37.5586, lng: -122.2711 },
  { name: "Belmont", aliases: ["belmont"], lat: 37.5202, lng: -122.2758 },
  { name: "San Carlos", aliases: ["san carlos"], lat: 37.5072, lng: -122.2605 },
  { name: "Menlo Park", aliases: ["menlo park"], lat: 37.453, lng: -122.1817 },
  { name: "East Palo Alto", aliases: ["east palo alto"], lat: 37.4688, lng: -122.1411 },

  // --- South Bay / Santa Clara Valley infill, toward Salinas via the 101 ---
  { name: "Milpitas", aliases: ["milpitas"], lat: 37.4323, lng: -121.8996 },
  { name: "Campbell", aliases: ["campbell"], lat: 37.2872, lng: -121.95 },
  { name: "Los Gatos", aliases: ["los gatos"], lat: 37.2358, lng: -121.9624 },
  { name: "Saratoga", aliases: ["saratoga"], lat: 37.2638, lng: -122.023 },
  { name: "Cupertino", aliases: ["cupertino"], lat: 37.323, lng: -122.0322 },
  { name: "Morgan Hill", aliases: ["morgan hill"], lat: 37.1305, lng: -121.6544 },
  { name: "Gilroy", aliases: ["gilroy"], lat: 37.0058, lng: -121.5683 },

  // --- North Bay infill ---
  { name: "San Rafael", aliases: ["san rafael"], lat: 37.9735, lng: -122.5311 },
  { name: "Novato", aliases: ["novato"], lat: 38.1074, lng: -122.5697 },
  { name: "Petaluma", aliases: ["petaluma"], lat: 38.2324, lng: -122.6367 },
  { name: "Rohnert Park", aliases: ["rohnert park"], lat: 38.3396, lng: -122.7011 },
  { name: "Sonoma", aliases: ["sonoma"], lat: 38.2919, lng: -122.458 },
  { name: "American Canyon", aliases: ["american canyon"], lat: 38.1749, lng: -122.2608 },

  // --- Santa Cruz County — Highway 1/17, the San Jose <-> Salinas/Monterey
  // stretch that's genuinely "between the Bay and Salinas." ---
  { name: "Santa Cruz", aliases: ["santa cruz"], lat: 36.9741, lng: -122.0308 },
  { name: "Scotts Valley", aliases: ["scotts valley"], lat: 37.0511, lng: -122.0138 },
  { name: "Capitola", aliases: ["capitola"], lat: 36.9752, lng: -121.953 },
  { name: "Watsonville", aliases: ["watsonville"], lat: 36.9102, lng: -121.7569 },

  // --- San Benito County — Highway 25/156, Gilroy <-> Salinas. ---
  { name: "Hollister", aliases: ["hollister"], lat: 36.8525, lng: -121.4016 },
  { name: "San Juan Bautista", aliases: ["san juan bautista"], lat: 36.8455, lng: -121.5372 },

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

  // --- Modesto/Merced area infill, and the towns that connect that stretch
  // toward Salinas over Pacheco Pass (Highway 152). ---
  { name: "Escalon", aliases: ["escalon"], lat: 37.7963, lng: -120.9955 },
  { name: "Oakdale", aliases: ["oakdale"], lat: 37.7663, lng: -120.8471 },
  { name: "Riverbank", aliases: ["riverbank"], lat: 37.7363, lng: -120.9327 },
  { name: "Ceres", aliases: ["ceres"], lat: 37.5949, lng: -120.9577 },
  { name: "Patterson", aliases: ["patterson"], lat: 37.4716, lng: -121.1294 },
  { name: "Newman", aliases: ["newman"], lat: 37.3138, lng: -121.0208 },
  { name: "Gustine", aliases: ["gustine"], lat: 37.2588, lng: -120.9994 },
  { name: "Los Banos", aliases: ["los banos"], lat: 37.0585, lng: -120.8499 },
  { name: "Atwater", aliases: ["atwater"], lat: 37.3477, lng: -120.6082 },

  // --- Coast + Southern markets we list ---
  { name: "Salinas", aliases: ["salinas"], lat: 36.6777, lng: -121.6555 },
  { name: "Monterey", aliases: ["monterey"], lat: 36.6002, lng: -121.8947 },
  { name: "Los Angeles", aliases: ["los angeles", "la", "l.a."], lat: 34.0522, lng: -118.2437 },

  // --- Salinas Valley, south along the 101 from Salinas itself ---
  { name: "Gonzales", aliases: ["gonzales"], lat: 36.5041, lng: -121.4444 },
  { name: "Soledad", aliases: ["soledad"], lat: 36.4246, lng: -121.326 },
  { name: "Greenfield", aliases: ["greenfield"], lat: 36.3216, lng: -121.243 },
  { name: "King City", aliases: ["king city"], lat: 36.2124, lng: -121.1266 },

  // --- Monterey Peninsula, alongside the existing Monterey entry ---
  { name: "Marina", aliases: ["marina"], lat: 36.6844, lng: -121.8022 },
  { name: "Seaside", aliases: ["seaside"], lat: 36.6111, lng: -121.8516 },
  { name: "Pacific Grove", aliases: ["pacific grove"], lat: 36.6177, lng: -121.9166 },
  { name: "Prunedale", aliases: ["prunedale"], lat: 36.7825, lng: -121.6539 },

  // --- Rural & unincorporated, Greater Sacramento and the foothills ---
  //
  // Everything above this line is an incorporated city — the kind of name a
  // geocoder's own database already knows. This block exists because a lot of
  // the Greater Sacramento area isn't that: real customers live in Wilton,
  // Rio Linda, or out past Rancho Murieta, in communities that are easy for a
  // human to recognise in an address and easy for a geocoder with thin rural
  // coverage to miss entirely. Without an anchor for the name itself, a
  // customer out here who Census and Photon both fail on doesn't fall back to
  // an approximate price — they fall back to nothing.
  { name: "Rio Linda", aliases: ["rio linda"], lat: 38.6969, lng: -121.4527 },
  { name: "Elverta", aliases: ["elverta"], lat: 38.7291, lng: -121.4574 },
  { name: "Carmichael", aliases: ["carmichael"], lat: 38.6079, lng: -121.3266 },
  { name: "Fair Oaks", aliases: ["fair oaks"], lat: 38.6446, lng: -121.2716 },
  { name: "Orangevale", aliases: ["orangevale"], lat: 38.6779, lng: -121.2202 },
  { name: "North Highlands", aliases: ["north highlands"], lat: 38.6835, lng: -121.386 },
  { name: "Antelope", aliases: ["antelope"], lat: 38.7141, lng: -121.3688 },
  { name: "Wilton", aliases: ["wilton"], lat: 38.4021, lng: -121.2455 },
  { name: "Herald", aliases: ["herald"], lat: 38.3435, lng: -121.2135 },
  { name: "Sloughhouse", aliases: ["sloughhouse"], lat: 38.4577, lng: -121.1974 },
  { name: "Rancho Murieta", aliases: ["rancho murieta"], lat: 38.4991, lng: -121.0932 },

  // The Delta — river towns strung along Highway 160 between Sacramento and
  // Antioch, most of them unincorporated.
  { name: "Walnut Grove", aliases: ["walnut grove"], lat: 38.2427, lng: -121.5202 },
  { name: "Courtland", aliases: ["courtland"], lat: 38.3327, lng: -121.5738 },
  { name: "Locke", aliases: ["locke"], lat: 38.2519, lng: -121.5069 },
  { name: "Isleton", aliases: ["isleton"], lat: 38.1602, lng: -121.6108 },
  { name: "Rio Vista", aliases: ["rio vista"], lat: 38.1585, lng: -121.7016 },
  { name: "Clarksburg", aliases: ["clarksburg"], lat: 38.4295, lng: -121.5388 },
  { name: "Thornton", aliases: ["thornton"], lat: 38.2385, lng: -121.4232 },

  // Rural Yolo County, west and north of Woodland.
  { name: "Knights Landing", aliases: ["knights landing"], lat: 38.7999, lng: -121.7202 },
  { name: "Esparto", aliases: ["esparto"], lat: 38.68, lng: -122.0116 },
  { name: "Madison", aliases: ["madison"], lat: 38.6841, lng: -121.9636 },
  { name: "Zamora", aliases: ["zamora"], lat: 38.8021, lng: -121.9174 },
  { name: "Dunnigan", aliases: ["dunnigan"], lat: 38.89, lng: -121.9613 },

  // The foothills, Placer and El Dorado County — where "further out" mostly
  // means uphill on Highway 50 or I-80 rather than further across the valley.
  { name: "Loomis", aliases: ["loomis"], lat: 38.8149, lng: -121.1908 },
  { name: "Penryn", aliases: ["penryn"], lat: 38.8471, lng: -121.1611 },
  { name: "Newcastle", aliases: ["newcastle"], lat: 38.8749, lng: -121.1327 },
  { name: "Lincoln", aliases: ["lincoln"], lat: 38.8916, lng: -121.293 },
  { name: "Cameron Park", aliases: ["cameron park"], lat: 38.67, lng: -120.9891 },
  { name: "El Dorado Hills", aliases: ["el dorado hills", "eldorado hills"], lat: 38.6857, lng: -121.0827 },
  { name: "Shingle Springs", aliases: ["shingle springs"], lat: 38.6541, lng: -120.9302 },
  { name: "Placerville", aliases: ["placerville"], lat: 38.7296, lng: -120.7985 },

  // Amador County — still inside a 150-mile radius of Sacramento and Manteca.
  { name: "Ione", aliases: ["ione"], lat: 38.3527, lng: -120.9327 },
  { name: "Plymouth", aliases: ["plymouth"], lat: 38.4832, lng: -120.8474 },
  { name: "Sutter Creek", aliases: ["sutter creek"], lat: 38.3927, lng: -120.8021 },
  { name: "Jackson", aliases: ["jackson"], lat: 38.3488, lng: -120.7738 },
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
