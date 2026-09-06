"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AddressAutocomplete, { type AddressValue } from "@/components/AddressAutocomplete";
import { MOVE_SIZE_OPTIONS, type MoveSizeValue } from "@/lib/moveSizes";
import { quoteTiers, type VehicleTierValue } from "@/lib/vehicleTiers";
import type { LatLng } from "@/lib/geo";

// Leaflet can't render on the server, and the map is below the fold on first
// paint anyway, so keep it out of the initial bundle.
const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[0.04]" />,
});

export type QuoteResult = {
  pickup: AddressValue;
  dropoff: AddressValue;
  moveSize: MoveSizeValue;
  tier: VehicleTierValue;
  miles: number | null;
  estimateLow: number;
  estimateHigh: number;
};

type RouteState = {
  miles: number;
  minutes: number;
  geometry: [number, number][];
  estimated: boolean;
};

export default function QuoteStep({
  initialPickup,
  initialDropoff,
  initialSize,
  onContinue,
}: {
  initialPickup?: string;
  initialDropoff?: string;
  initialSize?: MoveSizeValue;
  onContinue: (quote: QuoteResult) => void;
}) {
  const [pickup, setPickup] = useState<AddressValue>({
    address: initialPickup ?? "",
    lat: null,
    lng: null,
  });
  const [dropoff, setDropoff] = useState<AddressValue>({
    address: initialDropoff ?? "",
    lat: null,
    lng: null,
  });
  const [moveSize, setMoveSize] = useState<MoveSizeValue>(initialSize ?? "STUDIO");
  const [route, setRoute] = useState<RouteState | null>(null);
  const [showPrices, setShowPrices] = useState(false);
  const [loading, setLoading] = useState(false);

  const bothFilled = pickup.address.trim().length > 0 && dropoff.address.trim().length > 0;

  function swap() {
    setPickup(dropoff);
    setDropoff(pickup);
    setRoute(null);
  }

  async function seePrices() {
    if (!bothFilled) return;
    setShowPrices(true);
    setRoute(null);

    // Only routable when both addresses were picked from the dropdown. Typed
    // free text still gets a quote, just without mileage or a drawn route.
    if (pickup.lat === null || dropoff.lat === null) return;

    setLoading(true);
    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { lat: pickup.lat, lng: pickup.lng },
          dropoff: { lat: dropoff.lat, lng: dropoff.lng },
        }),
      });
      if (res.ok) setRoute((await res.json()) as RouteState);
    } catch {
      // Quote still renders without mileage.
    } finally {
      setLoading(false);
    }
  }

  const miles = route?.miles ?? null;
  const tiers = quoteTiers(moveSize, miles);

  const pickupPoint: LatLng | null =
    pickup.lat !== null && pickup.lng !== null ? { lat: pickup.lat, lng: pickup.lng } : null;
  const dropoffPoint: LatLng | null =
    dropoff.lat !== null && dropoff.lng !== null ? { lat: dropoff.lat, lng: dropoff.lng } : null;

  return (
    <div className="mt-8">
      {/* Address card */}
      <div className="relative rounded-3xl border-2 border-brand/60 bg-paper shadow-lg">
        <AddressAutocomplete
          label="Pick up from"
          placeholder="Pickup address"
          icon={<ArrowIcon direction="up" />}
          value={pickup}
          onChange={(v) => {
            setPickup(v);
            setRoute(null);
          }}
        />
        <div className="mx-4 border-t border-black/10" />
        <AddressAutocomplete
          label="Move to"
          placeholder="Drop-off address"
          icon={<ArrowIcon direction="down" />}
          value={dropoff}
          onChange={(v) => {
            setDropoff(v);
            setRoute(null);
          }}
        />

        {bothFilled && (
          <button
            type="button"
            onClick={swap}
            aria-label="Swap pickup and drop-off"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-paper text-neutral-500 shadow-sm transition hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M7 4v16m0-16 3 3M7 4 4 7" />
              <path d="M17 20V4m0 16 3-3m-3 3-3-3" />
            </svg>
          </button>
        )}

        <div className="p-3 pt-1">
          <button
            type="button"
            onClick={seePrices}
            disabled={!bothFilled}
            className="w-full rounded-2xl bg-gradient-to-r from-brand to-brand-cyan px-6 py-4 text-lg font-semibold text-white shadow-md transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            See prices
          </button>
        </div>
      </div>

      {showPrices && (
        <>
          {/* Map */}
          {(pickupPoint || dropoffPoint) && (
            <div className="mt-6 h-64 overflow-hidden rounded-3xl border border-black/10 sm:h-80">
              <RouteMap
                pickup={pickupPoint}
                dropoff={dropoffPoint}
                geometry={route?.geometry ?? []}
              />
            </div>
          )}

          {/* Trip summary */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-widest text-neutral-500">
            {loading && <span>Measuring the route…</span>}
            {!loading && route && (
              <>
                <span className="text-brand-cyan">{route.miles.toFixed(1)} mi</span>
                <span aria-hidden>·</span>
                <span>~{Math.round(route.minutes)} min drive</span>
                {route.estimated && <span className="normal-case tracking-normal">(approx.)</span>}
              </>
            )}
            {!loading && !route && (
              <span className="normal-case tracking-normal">
                Pick both addresses from the suggestions to map the route and price the mileage.
              </span>
            )}
          </div>

          {/* Move size — what's being moved drives the price as much as distance */}
          <div className="mt-6">
            <label htmlFor="quoteMoveSize" className="block text-sm font-semibold text-ink">
              How much are we moving?
            </label>
            <select
              id="quoteMoveSize"
              value={moveSize}
              onChange={(e) => setMoveSize(e.target.value as MoveSizeValue)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {MOVE_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle tiers */}
          <div className="mt-6 space-y-3">
            {tiers.map(({ tier, low, high }) => (
              <div
                key={tier.value}
                className="rounded-2xl border border-black/10 bg-black/[0.02] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-ink">{tier.label}</h3>
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-mono text-xs text-brand-cyan">
                        {tier.crew}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{tier.fits}</p>
                    <p className="mt-3 text-2xl font-bold text-ink">
                      ${low}–${high}
                    </p>
                    <p className="font-mono text-xs text-neutral-500">
                      estimate · {tier.dimensions}
                    </p>
                  </div>
                  <TierArt tier={tier.value} />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onContinue({
                      pickup,
                      dropoff,
                      moveSize,
                      tier: tier.value,
                      miles,
                      estimateLow: low,
                      estimateHigh: high,
                    })
                  }
                  className="mt-4 rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Continue
                </button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-neutral-500">
            Estimates, not final prices — a dispatcher confirms the exact number by phone before
            anyone drives out.
          </p>
        </>
      )}
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {direction === "up" ? (
        <path d="M12 20V4m0 0-6 6m6-6 6 6" />
      ) : (
        <path d="M12 4v16m0 0 6-6m-6 6-6-6" />
      )}
    </svg>
  );
}

function TierArt({ tier }: { tier: VehicleTierValue }) {
  const common = "h-14 w-24 shrink-0";
  if (tier === "PICKUP") {
    return (
      <svg viewBox="0 0 120 80" className={common} aria-hidden="true">
        <rect x="8" y="36" width="50" height="20" rx="3" fill="#F0455A" />
        <path d="M52,56 L52,28 Q52,18 62,18 L80,18 Q88,18 92,25 L100,34 L108,34 L108,56 Z" fill="#FF8A93" />
        <rect x="60" y="21" width="20" height="7" rx="2" fill="#7dd3fc" opacity="0.7" />
        <circle cx="32" cy="60" r="9" fill="#0d0f18" />
        <circle cx="92" cy="60" r="9" fill="#0d0f18" />
      </svg>
    );
  }
  if (tier === "VAN") {
    return (
      <svg viewBox="0 0 120 80" className={common} aria-hidden="true">
        <path d="M6 34c0-8 6-14 14-14h64c9 0 16 5 20 13l6 11v14H6V34z" fill="#F0455A" />
        <rect x="70" y="26" width="18" height="14" rx="3" fill="#0d0f18" opacity="0.5" />
        <circle cx="32" cy="60" r="9" fill="#0d0f18" />
        <circle cx="92" cy="60" r="9" fill="#0d0f18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 80" className={common} aria-hidden="true">
      <rect x="4" y="16" width="72" height="40" rx="6" fill="#C22C40" />
      <path d="M76 28h18l16 16v12H76V28z" fill="#E08E1D" />
      <path d="M90 32h9l10 10H90V32z" fill="#7dd3fc" opacity="0.85" />
      <circle cx="28" cy="60" r="10" fill="#0d0f18" />
      <circle cx="94" cy="60" r="10" fill="#0d0f18" />
    </svg>
  );
}
