"use client";

import AddressFields from "@/components/AddressFields";
import { isCompleteAddress, type StructuredAddress } from "@/lib/address";
import {
  DROPOFF_MODES,
  requiresDropoffAddress,
  type DropoffMode,
} from "@/lib/dropoffModes";

// Step 1: where it's coming from, and where — if anywhere — it's going.
//
// The second address is a question, not a requirement. Plenty of these jobs
// aren't moves: a dump run, a donation drop, help loading a POD that's already
// in the driveway. Asking those customers to invent a drop-off address was the
// fastest way to lose them.

export default function StepAddresses({
  pickup,
  dropoff,
  dropoffMode,
  onChange,
}: {
  pickup: StructuredAddress;
  dropoff: StructuredAddress;
  dropoffMode: DropoffMode;
  onChange: (next: {
    pickup: StructuredAddress;
    dropoff: StructuredAddress;
    dropoffMode: DropoffMode;
  }) => void;
}) {
  const needsDropoff = requiresDropoffAddress(dropoffMode);
  const canSwap = needsDropoff && isCompleteAddress(pickup) && isCompleteAddress(dropoff);

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Where are we going?</h2>
      <p className="mt-2 text-neutral-500">
        Street, city and ZIP for the pickup — that&apos;s what lets us map the exact route
        and price the drive properly instead of guessing.
      </p>

      <div className="mt-8 rounded-3xl border-2 border-brand/60 bg-paper shadow-lg">
        <AddressFields
          legend="Pick up from"
          icon={<ArrowIcon direction="up" />}
          value={pickup}
          onChange={(v) => onChange({ pickup: v, dropoff, dropoffMode })}
          // Pickup only: "my location" means where they are now, which is where
          // the stuff is. Offering it on the drop-off would fill the wrong end.
          enableLocation
        />

        <div className="relative mx-4 border-t border-black/10">
          {canSwap && (
            <button
              type="button"
              onClick={() => onChange({ pickup: dropoff, dropoff: pickup, dropoffMode })}
              aria-label="Swap pickup and drop-off"
              className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-paper text-neutral-500 shadow-sm transition hover:text-ink"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M7 4v16m0-16 3 3M7 4 4 7" />
                <path d="M17 20V4m0 16 3-3m-3 3-3-3" />
              </svg>
            </button>
          )}
        </div>

        <fieldset className="px-4 py-4">
          <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            <span className="text-neutral-400">
              <ArrowIcon direction="down" />
            </span>
            Where does it go?
          </legend>
          <div className="mt-3 grid gap-2">
            {DROPOFF_MODES.map((mode) => {
              const isSelected = dropoffMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onChange({ pickup, dropoff, dropoffMode: mode.value })}
                  className={`rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-brand bg-brand/5"
                      : "border-black/10 hover:border-brand/40"
                  }`}
                >
                  <span className="block text-sm font-semibold text-ink">{mode.label}</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {mode.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {needsDropoff && (
          <>
            <div className="mx-4 border-t border-black/10" />
            <AddressFields
              legend="Drop off at"
              icon={<ArrowIcon direction="down" />}
              value={dropoff}
              onChange={(v) => onChange({ pickup, dropoff: v, dropoffMode })}
            />
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        {dropoffMode === "WE_CHOOSE"
          ? "We price a typical local run to the nearest donation centre or transfer station. Dump or donation fees aren't included — a dispatcher confirms those with you."
          : "Nothing is charged until a dispatcher confirms the job with you."}
      </p>
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {direction === "up" ? (
        <path d="M12 20V4m0 0-6 6m6-6 6 6" />
      ) : (
        <path d="M12 4v16m0 0 6-6m-6 6-6-6" />
      )}
    </svg>
  );
}
