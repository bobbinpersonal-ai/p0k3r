"use client";

import dynamic from "next/dynamic";
import { MOVE_SIZE_OPTIONS, type MoveSizeValue } from "@/lib/moveSizes";
import { quoteTiers, type VehicleTierValue } from "@/lib/vehicleTiers";
import type { LatLng } from "@/lib/geo";

// Step 2: the route on a map, then a card per vehicle with a price on it.
// Picking a card is what advances the wizard.

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-black/[0.04]" />,
});

export type RouteState = {
  miles: number;
  minutes: number;
  geometry: [number, number][];
  estimated: boolean;
};

export default function StepVehicle({
  pickupPoint,
  dropoffPoint,
  route,
  loadingRoute,
  approximate,
  moveSize,
  selectedTier,
  onMoveSizeChange,
  onSelectTier,
}: {
  pickupPoint: LatLng | null;
  dropoffPoint: LatLng | null;
  route: RouteState | null;
  loadingRoute: boolean;
  /** One or both ends resolved to a town centre rather than a building. */
  approximate: boolean;
  moveSize: MoveSizeValue;
  selectedTier: VehicleTierValue | null;
  onMoveSizeChange: (size: MoveSizeValue) => void;
  onSelectTier: (tier: VehicleTierValue, low: number, high: number) => void;
}) {
  const miles = route?.miles ?? null;
  const tiers = quoteTiers(moveSize, miles);

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Pick your truck</h2>
      <p className="mt-2 text-neutral-500">
        Prices are estimates — a dispatcher confirms the exact number by phone.
      </p>

      {(pickupPoint || dropoffPoint) && (
        <div className="mt-6 h-56 overflow-hidden rounded-3xl border border-black/10 sm:h-72">
          <RouteMap
            pickup={pickupPoint}
            dropoff={dropoffPoint}
            geometry={route?.geometry ?? []}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-widest text-neutral-500">
        {loadingRoute && <span>Measuring the route…</span>}
        {!loadingRoute && route && (
          <>
            <span className="text-brand-cyan">{route.miles.toFixed(1)} mi</span>
            <span aria-hidden>·</span>
            <span>~{Math.round(route.minutes)} min drive</span>
            {(route.estimated || approximate) && (
              <span className="normal-case tracking-normal">
                {approximate
                  ? "· approximate — measured town to town, dispatch confirms the exact address"
                  : "(approx.)"}
              </span>
            )}
          </>
        )}
        {!loadingRoute && !route && (
          <span className="normal-case tracking-normal">
            We couldn&apos;t place one of these addresses. Mileage isn&apos;t included below —
            dispatch will confirm it when they call.
          </span>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor="quoteMoveSize" className="block text-sm font-semibold text-ink">
          How much are we moving?
        </label>
        <select
          id="quoteMoveSize"
          value={moveSize}
          onChange={(e) => onMoveSizeChange(e.target.value as MoveSizeValue)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          {MOVE_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} — {option.description}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {tiers.map(({ tier, low, high }) => {
          const isSelected = selectedTier === tier.value;
          return (
            <button
              key={tier.value}
              type="button"
              onClick={() => onSelectTier(tier.value, low, high)}
              aria-pressed={isSelected}
              className={`block w-full rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-black/10 bg-black/[0.02] hover:border-brand/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-bold text-ink">{tier.label}</span>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TierArt({ tier }: { tier: VehicleTierValue }) {
  const common = "h-14 w-24 shrink-0";
  if (tier === "PICKUP") {
    return (
      <svg viewBox="0 0 120 80" className={common} aria-hidden="true">
        <rect x="8" y="36" width="50" height="20" rx="3" fill="#F0455A" />
        <path
          d="M52,56 L52,28 Q52,18 62,18 L80,18 Q88,18 92,25 L100,34 L108,34 L108,56 Z"
          fill="#FF8A93"
        />
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
