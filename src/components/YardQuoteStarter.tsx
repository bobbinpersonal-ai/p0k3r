"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LANDSCAPING_SERVICES,
  startingPriceFor,
  type LandscapingServiceValue,
} from "@/lib/landscaping";
import { YARD_SERVICE_ICONS } from "@/components/YardIcons";
import UseMyLocationButton from "@/components/UseMyLocationButton";
import { EMPTY_ADDRESS, formatAddress } from "@/lib/address";

// The hero widget: one address box, and into the flow.
//
// This replaced a live price calculator. The calculator quoted an exact number
// off a yard size the customer had guessed at from a dropdown, which meant the
// first price they saw was one we might have to correct later — the exact
// failure a flat-price business can least afford. Now the address comes first,
// the county tells us roughly how big the lot is, and every service is priced
// against that on one screen. Nothing out here quotes more than a "from".
//
// The service chips are optional and only carry a preference through to the
// flow; they don't gate anything, because someone who wants a price shouldn't
// have to classify their own job before they can ask for one.

export default function YardQuoteStarter({ city }: { city?: string }) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [service, setService] = useState<LandscapingServiceValue | null>(null);
  // Held from "use my location" so the flow can price off the real fix rather
  // than re-geocoding the text we just wrote into the box.
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (address.trim()) params.set("address", address.trim());
    if (service) params.set("service", service);
    if (city) params.set("city", city);
    if (point) {
      params.set("lat", String(point.lat));
      params.set("lng", String(point.lng));
    }
    router.push(`/yard?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      // Translucent so the hero footage reads through it. The blur is behind a
      // `supports-` guard on purpose: backdrop-filter is one of the least
      // reliable effects on older Safari/iPadOS, and this site has already been
      // bitten by that class of bug. Browsers without it get a more opaque
      // panel — still shows the video, still legible, no compositor risk.
      className="mt-8 rounded-2xl border border-white/40 bg-paper/85 p-4 shadow-xl ring-1 ring-black/5 supports-[backdrop-filter]:bg-paper/65 supports-[backdrop-filter]:backdrop-blur-md sm:p-5"
    >
      <p className="text-sm font-semibold text-ink">Where&apos;s the yard?</p>
      <label className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 bg-paper/80 px-4 py-3">
        <span className="shrink-0 text-neutral-400">
          <PinIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-neutral-500">Property address</span>
          <input
            value={address}
            autoComplete="street-address"
            placeholder="Street, city or ZIP"
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-lg text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-0"
          />
        </span>
      </label>
      <div className="mt-2">
        <UseMyLocationButton
          label="Use my location"
          onResolved={({ street, city: town, zip, point: fix }) => {
            setAddress(formatAddress({ ...EMPTY_ADDRESS, street, city: town, zip }));
            setPoint(fix);
          }}
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">
        What does it need?{" "}
        <span className="font-normal text-neutral-500">(optional)</span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LANDSCAPING_SERVICES.map((option) => {
          const Icon = YARD_SERVICE_ICONS[option.value];
          const isSelected = option.value === service;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setService(isSelected ? null : option.value)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${
                isSelected
                  ? "border-brand bg-brand/10"
                  : "border-black/10 bg-paper/60 hover:border-brand/40"
              }`}
            >
              {Icon && <Icon />}
              <span className="text-xs font-semibold leading-tight text-ink">
                {option.label}
              </span>
              <span className="font-mono text-[11px] text-neutral-400">
                from ${startingPriceFor(option.value)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90"
      >
        See my prices
      </button>
      <p className="mt-3 text-xs text-neutral-500">
        {/* The "from" prices above are the small-yard rate. The real number
            depends on the yard, which is what the address is for — so promise
            the exact price rather than implying these are it. */}
        We&apos;ll look up your lot and show you every service priced for your yard — no
        site visit, no account, nothing charged.
      </p>
    </form>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
