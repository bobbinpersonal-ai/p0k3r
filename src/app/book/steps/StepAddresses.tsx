"use client";

import AddressFields from "@/components/AddressFields";
import { isCompleteAddress, type StructuredAddress } from "@/lib/address";

// Step 1: where it's coming from and where it's going. Everything downstream
// (route, distance, price) hangs off these two, which is why the full address
// is asked for here rather than being guessed from a single line.

export default function StepAddresses({
  pickup,
  dropoff,
  onChange,
}: {
  pickup: StructuredAddress;
  dropoff: StructuredAddress;
  onChange: (next: { pickup: StructuredAddress; dropoff: StructuredAddress }) => void;
}) {
  const bothComplete = isCompleteAddress(pickup) && isCompleteAddress(dropoff);

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Where are we moving you?</h2>
      <p className="mt-2 text-neutral-500">
        Street, city and ZIP for both ends — that&apos;s what lets us map the exact route and
        price the drive properly instead of guessing.
      </p>

      <div className="mt-8 rounded-3xl border-2 border-brand/60 bg-paper shadow-lg">
        <AddressFields
          legend="Pick up from"
          icon={<ArrowIcon direction="up" />}
          value={pickup}
          onChange={(v) => onChange({ pickup: v, dropoff })}
        />

        <div className="relative mx-4 border-t border-black/10">
          {bothComplete && (
            <button
              type="button"
              onClick={() => onChange({ pickup: dropoff, dropoff: pickup })}
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

        <AddressFields
          legend="Move to"
          icon={<ArrowIcon direction="down" />}
          value={dropoff}
          onChange={(v) => onChange({ pickup, dropoff: v })}
        />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        We only need the ZIP to measure the drive — nothing is charged until a dispatcher
        confirms the job with you.
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
