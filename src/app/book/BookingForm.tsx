"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOVE_SIZE_OPTIONS, TIME_WINDOWS, type MoveSizeValue } from "@/lib/moveSizes";
import { SERVICE_TYPES, type ServiceTypeValue } from "@/lib/serviceTypes";
import { trackBookingConversion } from "@/lib/analytics";
import { scrollToNext } from "@/lib/scrollToNext";

const inputClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingForm({
  initialSize,
  initialPickup,
  initialDropoff,
  city,
}: {
  initialSize?: MoveSizeValue;
  initialPickup?: string;
  initialDropoff?: string;
  city?: string;
}) {
  const router = useRouter();
  const [moveSize, setMoveSize] = useState<MoveSizeValue>(initialSize ?? "STUDIO");
  const [serviceType, setServiceType] = useState<ServiceTypeValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moveSizeRef = useRef<HTMLFieldSetElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!serviceType) {
      setError("Let us know what kind of help you need.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const serviceTypeOther = String(form.get("serviceTypeOther") || "").trim();

    if (serviceType === "OTHER" && !serviceTypeOther) {
      setError("Tell us a bit about what you need help with.");
      return;
    }

    setSubmitting(true);

    const payload = {
      customerName: String(form.get("customerName") || ""),
      customerPhone: String(form.get("customerPhone") || ""),
      customerEmail: String(form.get("customerEmail") || "") || undefined,
      pickupAddress: String(form.get("pickupAddress") || ""),
      dropoffAddress: String(form.get("dropoffAddress") || ""),
      moveDate: String(form.get("moveDate") || ""),
      timeWindow: String(form.get("timeWindow") || ""),
      moveSize,
      serviceType,
      serviceTypeOther: serviceType === "OTHER" ? serviceTypeOther : undefined,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pickupAddress" className="block text-sm font-semibold text-ink">
            Pickup address
          </label>
          <input
            id="pickupAddress"
            name="pickupAddress"
            required
            defaultValue={initialPickup}
            className={inputClass}
            placeholder="123 Main St, Apt 4B"
          />
        </div>
        <div>
          <label htmlFor="dropoffAddress" className="block text-sm font-semibold text-ink">
            Drop-off address
          </label>
          <input
            id="dropoffAddress"
            name="dropoffAddress"
            required
            defaultValue={initialDropoff}
            className={inputClass}
            placeholder="456 Oak Ave"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">
          What do you need help with?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SERVICE_TYPES.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                serviceType === option.value
                  ? "border-brand bg-brand/10 ring-1 ring-brand"
                  : "border-black/10 bg-black/[0.02] hover:border-black/20"
              }`}
            >
              <input
                type="radio"
                name="serviceTypeRadio"
                value={option.value}
                checked={serviceType === option.value}
                onChange={() => {
                  setServiceType(option.value);
                  if (option.value !== "OTHER") scrollToNext(moveSizeRef);
                }}
                className="sr-only"
              />
              <span className="font-semibold text-ink">{option.label}</span>
              <span className="mt-1 text-sm text-neutral-500">{option.description}</span>
            </label>
          ))}
        </div>
        {serviceType === "OTHER" && (
          <textarea
            name="serviceTypeOther"
            rows={2}
            required
            className={`${inputClass} mt-3`}
            placeholder="Tell us what you need — we'll follow up with a price."
          />
        )}
      </fieldset>

      <fieldset ref={moveSizeRef}>
        <legend className="text-sm font-semibold text-ink">How much is moving?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MOVE_SIZE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                moveSize === option.value
                  ? "border-brand bg-brand/10 ring-1 ring-brand"
                  : "border-black/10 bg-black/[0.02] hover:border-black/20"
              }`}
            >
              <input
                type="radio"
                name="moveSizeRadio"
                value={option.value}
                checked={moveSize === option.value}
                onChange={() => {
                  setMoveSize(option.value);
                  scrollToNext(dateTimeRef);
                }}
                className="sr-only"
              />
              <span className="font-semibold text-ink">{option.label}</span>
              <span className="mt-1 text-sm text-neutral-500">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div ref={dateTimeRef} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="moveDate" className="block text-sm font-semibold text-ink">
            Move date
          </label>
          <input
            id="moveDate"
            name="moveDate"
            type="date"
            required
            min={todayISODate()}
            defaultValue={todayISODate()}
            className={`${inputClass} [color-scheme:light]`}
          />
        </div>
        <div>
          <label htmlFor="timeWindow" className="block text-sm font-semibold text-ink">
            Time window
          </label>
          <select
            id="timeWindow"
            name="timeWindow"
            required
            defaultValue={TIME_WINDOWS[0]}
            className={`${inputClass} [color-scheme:light]`}
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w} value={w} className="bg-paper">
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-ink">
          Anything we should know? (optional)
        </label>
        <textarea
          id="details"
          name="details"
          rows={3}
          className={inputClass}
          placeholder="Stairs, elevator, oversized items, parking notes..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="customerName" className="block text-sm font-semibold text-ink">
            Full name
          </label>
          <input id="customerName" name="customerName" required className={inputClass} />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="customerPhone" className="block text-sm font-semibold text-ink">
            Phone
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            required
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="customerEmail" className="block text-sm font-semibold text-ink">
            Email (optional)
          </label>
          <input id="customerEmail" name="customerEmail" type="email" className={inputClass} />
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4">
        <p className="text-sm text-neutral-500">
          This doesn&apos;t book your move yet. Submitting sends your request to a dispatcher,
          who will call or text you — usually within 30 minutes — to confirm your time window,
          the scope of your move, and any deposit over the phone.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Booking..." : "Request this move"}
        </button>
        <p className="text-center text-xs text-neutral-400">
          Nothing is final until you connect with us by phone.
        </p>
      </div>
    </form>
  );
}
