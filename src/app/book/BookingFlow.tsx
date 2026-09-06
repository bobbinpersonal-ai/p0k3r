"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StepAddresses from "@/app/book/steps/StepAddresses";
import StepVehicle, { type RouteState } from "@/app/book/steps/StepVehicle";
import StepSchedule from "@/app/book/steps/StepSchedule";
import StepItems, { type ItemsValue } from "@/app/book/steps/StepItems";
import StepContact, { type ContactValue } from "@/app/book/steps/StepContact";
import type { AddressValue } from "@/components/AddressAutocomplete";
import type { MoveSizeValue } from "@/lib/moveSizes";
import type { VehicleTierValue } from "@/lib/vehicleTiers";
import { firstBookableDay, windowLabel } from "@/lib/arrivalWindows";
import { trackBookingConversion } from "@/lib/analytics";
import type { LatLng } from "@/lib/geo";

// The five-step booking wizard: addresses → truck → arrival time → what
// you're moving → who you are. One step on screen at a time, with the whole
// draft held here so moving backwards never loses what was already entered.

const TOTAL_STEPS = 5;

export default function BookingFlow({
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
  const [step, setStep] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

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
  const [route, setRoute] = useState<RouteState | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [moveSize, setMoveSize] = useState<MoveSizeValue>(initialSize ?? "STUDIO");
  const [tier, setTier] = useState<VehicleTierValue | null>(null);
  const [estimate, setEstimate] = useState<{ low: number; high: number } | null>(null);

  const [schedule, setSchedule] = useState<{ dayKey: string; arrivalHour: number | null }>(() => ({
    dayKey: firstBookableDay().key,
    arrivalHour: null,
  }));

  const [items, setItems] = useState<ItemsValue>({
    serviceType: null,
    serviceTypeOther: "",
    details: "",
    needsHelper: null,
  });

  const [contact, setContact] = useState<ContactValue>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Keep each new step starting at its heading rather than mid-page.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const pickupPoint: LatLng | null =
    pickup.lat !== null && pickup.lng !== null ? { lat: pickup.lat, lng: pickup.lng } : null;
  const dropoffPoint: LatLng | null =
    dropoff.lat !== null && dropoff.lng !== null ? { lat: dropoff.lat, lng: dropoff.lng } : null;

  async function loadRoute() {
    setRoute(null);
    if (!pickupPoint || !dropoffPoint) return; // free-text addresses: no route, still bookable
    setLoadingRoute(true);
    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup: pickupPoint, dropoff: dropoffPoint }),
      });
      if (res.ok) setRoute((await res.json()) as RouteState);
    } catch {
      // Priced without mileage rather than blocking the booking.
    } finally {
      setLoadingRoute(false);
    }
  }

  function canAdvance(): string | null {
    if (step === 1) {
      if (!pickup.address.trim() || !dropoff.address.trim()) {
        return "Enter both a pickup and a drop-off address.";
      }
    }
    if (step === 2 && !tier) return "Pick a vehicle to continue.";
    if (step === 3 && schedule.arrivalHour === null) return "Choose an arrival window.";
    if (step === 4) {
      if (!items.serviceType) return "Let us know what kind of help you need.";
      if (items.serviceType === "OTHER" && !items.serviceTypeOther.trim()) {
        return "Tell us a bit about what you need help with.";
      }
      if (items.needsHelper === null) return "Let us know if you need an extra helper.";
    }
    return null;
  }

  function next() {
    const problem = canAdvance();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (step === 1) void loadRoute();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  async function submit() {
    if (!contact.customerName.trim() || !contact.customerPhone.trim()) {
      setError("We need a name and phone number to confirm your move.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const payload = {
      ...contact,
      customerEmail: contact.customerEmail.trim() || undefined,
      pickupAddress: pickup.address,
      dropoffAddress: dropoff.address,
      moveDate: schedule.dayKey,
      timeWindow: schedule.arrivalHour !== null ? windowLabel(schedule.arrivalHour) : "",
      moveSize,
      serviceType: items.serviceType,
      serviceTypeOther:
        items.serviceType === "OTHER" ? items.serviceTypeOther.trim() : undefined,
      needsHelper: items.needsHelper,
      details: items.details.trim() || undefined,
      city,
      pickupLat: pickup.lat ?? undefined,
      pickupLng: pickup.lng ?? undefined,
      dropoffLat: dropoff.lat ?? undefined,
      dropoffLng: dropoff.lng ?? undefined,
      distanceMiles: route?.miles ?? undefined,
      vehicleTier: tier ?? undefined,
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
    <div ref={topRef} className="mt-8 scroll-mt-24">
      {/* Progress */}
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Step {step}/{TOTAL_STEPS}
      </p>
      <div className="mt-3 flex gap-2" aria-hidden>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-brand" : "bg-black/10"}`}
          />
        ))}
      </div>

      <div className="mt-8">
        {step === 1 && (
          <StepAddresses
            pickup={pickup}
            dropoff={dropoff}
            onChange={({ pickup: p, dropoff: d }) => {
              setPickup(p);
              setDropoff(d);
              setRoute(null);
            }}
          />
        )}
        {step === 2 && (
          <StepVehicle
            pickupPoint={pickupPoint}
            dropoffPoint={dropoffPoint}
            route={route}
            loadingRoute={loadingRoute}
            moveSize={moveSize}
            selectedTier={tier}
            onMoveSizeChange={setMoveSize}
            onSelectTier={(value, low, high) => {
              setTier(value);
              setEstimate({ low, high });
              setError(null);
            }}
          />
        )}
        {step === 3 && (
          <StepSchedule
            dayKey={schedule.dayKey}
            arrivalHour={schedule.arrivalHour}
            onChange={(next) => {
              setSchedule(next);
              setError(null);
            }}
          />
        )}
        {step === 4 && <StepItems value={items} onChange={setItems} />}
        {step === 5 && <StepContact value={contact} onChange={setContact} />}
      </div>

      {/* Running total, once there's something to show */}
      {step > 2 && estimate && (
        <p className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-neutral-500">
          Estimate so far:{" "}
          <span className="font-semibold text-ink">
            ${estimate.low}–${estimate.high}
          </span>
          {route && ` · ${route.miles.toFixed(1)} mi`}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 text-sm text-brand">
          {error}
        </p>
      )}

      {/* Nav */}
      <div className="mt-8 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
            aria-label="Go back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/15 text-ink transition hover:border-brand/40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={step === TOTAL_STEPS ? submit : next}
          disabled={submitting}
          className="flex-1 rounded-2xl bg-gradient-to-r from-brand to-brand-cyan px-6 py-4 text-lg font-semibold text-white shadow-md transition enabled:hover:opacity-90 disabled:opacity-50"
        >
          {step === TOTAL_STEPS ? (submitting ? "Booking…" : "Book my move") : "Continue"}
        </button>
      </div>

      {step === TOTAL_STEPS && (
        <p className="mt-4 text-sm text-neutral-500">
          No charge now — a dispatcher confirms your crew and final price first.
        </p>
      )}
    </div>
  );
}
