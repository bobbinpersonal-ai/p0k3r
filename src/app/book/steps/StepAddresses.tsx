"use client";

import AddressAutocomplete, { type AddressValue } from "@/components/AddressAutocomplete";

// Step 1: where it's coming from and where it's going. Everything downstream
// (route, distance, price) hangs off these two.

export default function StepAddresses({
  pickup,
  dropoff,
  onChange,
}: {
  pickup: AddressValue;
  dropoff: AddressValue;
  onChange: (next: { pickup: AddressValue; dropoff: AddressValue }) => void;
}) {
  const bothFilled = pickup.address.trim().length > 0 && dropoff.address.trim().length > 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">Where are we moving you?</h2>
      <p className="mt-2 text-neutral-500">
        Pick both addresses from the suggestions and we&apos;ll map the route and price the
        drive.
      </p>

      <div className="relative mt-8 rounded-3xl border-2 border-brand/60 bg-paper shadow-lg">
        <AddressAutocomplete
          label="Pick up from"
          placeholder="Pickup address"
          icon={<ArrowIcon direction="up" />}
          value={pickup}
          onChange={(v) => onChange({ pickup: v, dropoff })}
        />
        <div className="mx-4 border-t border-black/10" />
        <AddressAutocomplete
          label="Move to"
          placeholder="Drop-off address"
          icon={<ArrowIcon direction="down" />}
          value={dropoff}
          onChange={(v) => onChange({ pickup, dropoff: v })}
        />

        {bothFilled && (
          <button
            type="button"
            onClick={() => onChange({ pickup: dropoff, dropoff: pickup })}
            aria-label="Swap pickup and drop-off"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-paper text-neutral-500 shadow-sm transition hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
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
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
