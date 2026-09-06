// A structured US address: street, unit, city, ZIP.
//
// We ask for these as separate fields rather than one free-text line because
// the keyless geocoders we run on are dramatically more accurate when they
// don't have to guess where the street ends and the city begins. The Census
// geocoder in particular has a structured endpoint that takes the parts
// separately and matches against TIGER/Line address ranges — that's the
// difference between pinning the customer's building and dropping a pin in the
// middle of their town, which is what decides whether the mileage on the quote
// is real.
//
// State is not asked for: we only move people inside California.

import { findServiceAreaPlace } from "@/lib/serviceAreaPlaces";

export type StructuredAddress = {
  street: string;
  /** Apartment/unit. Optional, and never sent to the geocoder — see below. */
  unit: string;
  city: string;
  zip: string;
};

export const EMPTY_ADDRESS: StructuredAddress = { street: "", unit: "", city: "", zip: "" };

export const ADDRESS_STATE = "CA";

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

/** Everything the map and the mileage need. Unit is deliberately not required. */
export function isCompleteAddress(a: StructuredAddress): boolean {
  return a.street.trim().length >= 3 && a.city.trim().length >= 2 && isValidZip(a.zip);
}

/** Which fields are missing, for inline validation messages. */
export function missingAddressFields(a: StructuredAddress): string[] {
  const missing: string[] = [];
  if (a.street.trim().length < 3) missing.push("street address");
  if (a.city.trim().length < 2) missing.push("city");
  if (!isValidZip(a.zip)) missing.push("5-digit ZIP");
  return missing;
}

/**
 * One line for display, the booking record, and the dispatcher reading it off
 * a phone. Unit is included here — it matters to the mover at the door, even
 * though it's stripped before geocoding.
 */
export function formatAddress(a: StructuredAddress): string {
  const unit = a.unit.trim().replace(/^#\s*/, "");
  const street = [a.street.trim(), unit && `#${unit}`].filter(Boolean).join(" ");
  const cityState = [a.city.trim(), [ADDRESS_STATE, a.zip.trim()].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [street, cityState].filter(Boolean).join(", ");
}

/** True once there's enough typed to be worth geocoding at all. */
export function hasAnyAddress(a: StructuredAddress): boolean {
  return Boolean(a.street.trim() || a.city.trim() || a.zip.trim());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Best-effort split of a typed one-liner into fields.
 *
 * The homepage hero still takes a single box — asking for eight inputs above
 * the fold would cost more bookings than a tidier address is worth — so this
 * pre-fills the booking form's fields from whatever they typed there. It is
 * only ever a starting point: every part lands in an editable field the
 * customer sees before anything is priced.
 */
export function parseAddress(text: string): StructuredAddress {
  const raw = text.trim();
  if (!raw) return { ...EMPTY_ADDRESS };

  let rest = raw;
  let zip = "";

  // ZIP first: it's the least ambiguous token in the string.
  const zipMatch = rest.match(/\b(\d{5})(?:-\d{4})?\b\s*,?\s*(?:USA?)?\s*$/i);
  if (zipMatch) {
    zip = zipMatch[1];
    rest = rest.slice(0, zipMatch.index).trim();
  }

  // Then the trailing country/state, which carry no information here.
  rest = rest
    .replace(/[,\s]+(?:USA|United States)\.?\s*$/i, "")
    .replace(/[,\s]+(?:CA|California)\.?\s*$/i, "")
    .replace(/[,\s]*$/, "")
    .trim();

  const parts = rest
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      street: parts.slice(0, -1).join(", "),
      unit: "",
      city: parts[parts.length - 1],
      zip,
    };
  }

  // No commas to split on — look for a town we serve inside the text and cut
  // there. Matching on the alias the customer actually typed, not the
  // canonical name, so "sac" doesn't leave "1710 Lee Ct sac" in the street.
  const town = findServiceAreaPlace(rest);
  if (town) {
    const spellings = [town.name, ...town.aliases].sort((a, b) => b.length - a.length);
    for (const spelling of spellings) {
      // `^|[,\s]` so a box containing nothing but the town name ("Sacramento")
      // resolves to a city with an empty street, rather than both at once.
      const trailing = new RegExp(`(?:^|[,\\s]+)${escapeRegExp(spelling)}\\s*$`, "i");
      if (trailing.test(rest)) {
        return { street: rest.replace(trailing, "").trim(), unit: "", city: town.name, zip };
      }
    }
    return { street: rest, unit: "", city: town.name, zip };
  }

  return { street: rest, unit: "", city: "", zip };
}
