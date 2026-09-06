"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddressAutocomplete, { type AddressValue } from "@/components/AddressAutocomplete";
import { MOVE_SIZE_OPTIONS, type MoveSizeValue } from "@/lib/moveSizes";

// The hero quote form. Same autocomplete as the booking wizard, and it hands
// the picked coordinates forward in the URL — without them /book would have
// the addresses as plain text and would have to ask the customer to pick them
// a second time before it could map the route.

export default function HeroQuoteForm({ city }: { city?: string }) {
  const router = useRouter();
  const [pickup, setPickup] = useState<AddressValue>({ address: "", lat: null, lng: null });
  const [dropoff, setDropoff] = useState<AddressValue>({ address: "", lat: null, lng: null });
  const [size, setSize] = useState<MoveSizeValue>(MOVE_SIZE_OPTIONS[0].value);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (pickup.address.trim()) params.set("pickup", pickup.address.trim());
    if (dropoff.address.trim()) params.set("dropoff", dropoff.address.trim());
    if (pickup.lat !== null && pickup.lng !== null) {
      params.set("pickupLat", String(pickup.lat));
      params.set("pickupLng", String(pickup.lng));
    }
    if (dropoff.lat !== null && dropoff.lng !== null) {
      params.set("dropoffLat", String(dropoff.lat));
      params.set("dropoffLng", String(dropoff.lng));
    }
    params.set("size", size);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-2xl border border-black/10 bg-paper/70 p-3 shadow-lg backdrop-blur sm:p-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-black/5">
          <AddressAutocomplete
            label="Pick up from"
            placeholder="Pickup address"
            icon={<ArrowIcon direction="up" />}
            value={pickup}
            onChange={setPickup}
          />
        </div>
        <div className="rounded-xl border border-black/10 bg-black/5">
          <AddressAutocomplete
            label="Move to"
            placeholder="Drop-off address"
            icon={<ArrowIcon direction="down" />}
            value={dropoff}
            onChange={setDropoff}
          />
        </div>
      </div>
      <select
        value={size}
        onChange={(e) => setSize(e.target.value as MoveSizeValue)}
        aria-label="How much are we moving?"
        className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-sm text-ink [color-scheme:light] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      >
        {MOVE_SIZE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-paper">
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!pickup.address.trim()}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition enabled:hover:opacity-90 disabled:opacity-50"
      >
        Get my 30-second quote
      </button>
    </form>
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
