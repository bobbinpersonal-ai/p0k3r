"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOVE_SIZE_OPTIONS, TIME_WINDOWS, type MoveSizeValue } from "@/lib/moveSizes";
import { trackBookingConversion } from "@/lib/analytics";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingForm({
  initialSize,
  city,
}: {
  initialSize?: MoveSizeValue;
  city?: string;
}) {
  const router = useRouter();
  const [moveSize, setMoveSize] = useState<MoveSizeValue>(initialSize ?? "STUDIO");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = MOVE_SIZE_OPTIONS.find((o) => o.value === moveSize)!;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: String(form.get("customerName") || ""),
      customerPhone: String(form.get("customerPhone") || ""),
      customerEmail: String(form.get("customerEmail") || "") || undefined,
      pickupAddress: String(form.get("pickupAddress") || ""),
      dropoffAddress: String(form.get("dropoffAddress") || ""),
      moveDate: String(form.get("moveDate") || ""),
      timeWindow: String(form.get("timeWindow") || ""),
      moveSize,
      details: String(form.get("details") || "") || undefined,
      city,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Something went wrong. Please try again.");
      }

      const booking = await res.json();
      trackBookingConversion();
      router.push(`/book/confirmation?id=${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-8">
      <fieldset>
        <legend className="text-sm font-semibold text-brand-ink">How much is moving?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MOVE_SIZE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                moveSize === option.value
                  ? "border-brand bg-brand/5 ring-1 ring-brand"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="moveSizeRadio"
                value={option.value}
                checked={moveSize === option.value}
                onChange={() => setMoveSize(option.value)}
                className="sr-only"
              />
              <span className="font-semibold text-brand-ink">{option.label}</span>
              <span className="mt-1 text-sm text-slate-500">{option.description}</span>
              <span className="mt-2 text-sm font-bold text-brand">
                ${option.estimateLow}–${option.estimateHigh}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pickupAddress" className="block text-sm font-semibold text-brand-ink">
            Pickup address
          </label>
          <input
            id="pickupAddress"
            name="pickupAddress"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="123 Main St, Apt 4B"
          />
        </div>
        <div>
          <label htmlFor="dropoffAddress" className="block text-sm font-semibold text-brand-ink">
            Drop-off address
          </label>
          <input
            id="dropoffAddress"
            name="dropoffAddress"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="456 Oak Ave"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="moveDate" className="block text-sm font-semibold text-brand-ink">
            Move date
          </label>
          <input
            id="moveDate"
            name="moveDate"
            type="date"
            required
            min={todayISODate()}
            defaultValue={todayISODate()}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="timeWindow" className="block text-sm font-semibold text-brand-ink">
            Time window
          </label>
          <select
            id="timeWindow"
            name="timeWindow"
            required
            defaultValue={TIME_WINDOWS[0]}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-brand-ink">
          Anything we should know? (optional)
        </label>
        <textarea
          id="details"
          name="details"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          placeholder="Stairs, elevator, oversized items, parking notes..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="customerName" className="block text-sm font-semibold text-brand-ink">
            Full name
          </label>
          <input
            id="customerName"
            name="customerName"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="customerPhone" className="block text-sm font-semibold text-brand-ink">
            Phone
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="customerEmail" className="block text-sm font-semibold text-brand-ink">
            Email (optional)
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Estimated price</p>
        <p className="text-2xl font-extrabold text-brand-ink">
          ${selectedOption.estimateLow}–${selectedOption.estimateHigh}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Final price is confirmed by your dispatcher based on crew and distance.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Booking..." : "Request this move"}
      </button>
    </form>
  );
}
