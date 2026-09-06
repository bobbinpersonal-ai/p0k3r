"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOVE_SIZE_OPTIONS, type MoveSizeValue } from "@/lib/moveSizes";
import { EMPTY_ADDRESS, formatAddress } from "@/lib/address";
import UseMyLocationButton from "@/components/UseMyLocationButton";

// The hero quote form: two plain address boxes and a size, forwarded to /book.
//
// Deliberately one box per address rather than the booking form's four fields.
// Eight inputs above the fold is a wall, and this form's job is to get someone
// into the flow, not to price the job. /book splits whatever they type into
// street/city/ZIP fields they can correct, and geocodes from there.

export default function HeroQuoteForm({ city }: { city?: string }) {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [size, setSize] = useState<MoveSizeValue>(MOVE_SIZE_OPTIONS[0].value);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (pickup.trim()) params.set("pickup", pickup.trim());
    if (dropoff.trim()) params.set("dropoff", dropoff.trim());
    params.set("size", size);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-2xl border border-black/10 bg-paper/70 p-3 shadow-lg backdrop-blur sm:p-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <HeroAddressInput
          label="Pick up from"
          placeholder="Pickup city or address"
          icon={<ArrowIcon direction="up" />}
          value={pickup}
          onChange={setPickup}
        />
        <HeroAddressInput
          // Plenty of these jobs have nowhere to go — a dump run, a donation, help
          // loading a container in the driveway. Two identical boxes read as
          // "both required", so say plainly that this one isn't.
          label="Move to (optional)"
          placeholder="Leave blank for a dump or donation run"
          icon={<ArrowIcon direction="down" />}
          value={dropoff}
          onChange={setDropoff}
        />
      </div>

      {/* Fills the pickup box with the town and ZIP only. The street is the
          part a GPS fix gets wrong anyway, and the part nobody tapping a
          convenience button meant to hand over. */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <UseMyLocationButton
          onResolved={({ city, zip }) =>
            setPickup(formatAddress({ ...EMPTY_ADDRESS, city, zip }))
          }
        />
        <p className="text-xs text-neutral-500">
          Junk haul, donation, or just loading help? Skip the second address.
        </p>
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
        disabled={!pickup.trim()}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition enabled:hover:opacity-90 disabled:opacity-50"
      >
        Get my 30-second quote
      </button>
    </form>
  );
}

function HeroAddressInput({
  label,
  placeholder,
  icon,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/5 px-4 py-3">
      <span className="shrink-0 text-neutral-400">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-neutral-500">{label}</span>
        <input
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-0 bg-transparent p-0 text-lg text-ink placeholder:text-neutral-400 focus:outline-none focus:ring-0"
        />
      </span>
    </label>
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
