"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StepJob from "@/app/book/steps/StepJob";
import StepAddresses from "@/app/book/steps/StepAddresses";
import StepVehicle, { type RouteState } from "@/app/book/steps/StepVehicle";
import StepSchedule from "@/app/book/steps/StepSchedule";
import StepItems, { type ItemsValue } from "@/app/book/steps/StepItems";
import StepContact, { type ContactValue } from "@/app/book/steps/StepContact";
import {
  EMPTY_ADDRESS,
  formatAddress,
  missingAddressFields,
  parseAddress,
  type StructuredAddress,
} from "@/lib/address";
import type { MoveSizeValue } from "@/lib/moveSizes";
import type { VehicleTierValue } from "@/lib/vehicleTiers";
import { firstBookableDay, windowLabel } from "@/lib/arrivalWindows";
import { matchCrew } from "@/lib/crew";
import { getVehicleTier } from "@/lib/vehicleTiers";
import { extraHelperFee, quoteForTier } from "@/lib/pricing";
import { getServiceType, type ServiceTypeValue } from "@/lib/serviceTypes";
import {
  dropoffLabelForMode,
  requiresDropoffAddress,
  routeForMode,
  type DropoffMode,
} from "@/lib/dropoffModes";
import CrewMatchCard from "@/components/CrewMatchCard";
import { trackBookingConversion } from "@/lib/analytics";
import type { LatLng } from "@/lib/geo";

// The booking wizard: what you need → addresses → truck → arrival time →
// details → who you are. One step on screen at a time, with the whole draft
// held here so moving backwards never loses what was already entered.
//
// "What you need" leads because most of our paid traffic arrives from
// Marketplace ads, where the first thing someone has to see is their own errand
// on the list. It also earns its place: the answer presets the drop-off mode
// and often the move size, so later steps ask less.

const TOTAL_STEPS = 6;

/** Which step collects the addresses — the one that triggers routing. */
const ADDRESS_STEP = 2;

/** Shown next to "Step 3 of 6" and on the tappable progress segments. */
const STEP_LABELS = [
  "What you need",
  "Addresses",
  "Your truck",
  "Arrival time",
  "Details",
  "Your info",
];

export default function BookingFlow({
  initialSize,
  initialPickup,
  initialDropoff,
  initialServiceType,
  city,
}: {
  initialSize?: MoveSizeValue;
  initialPickup?: string;
  initialDropoff?: string;
  /** Set when they tapped a job on the homepage, so we don't ask again. */
  initialServiceType?: ServiceTypeValue;
  city?: string;
}) {
  const router = useRouter();
  // Arriving from a homepage job chip means step 1 is already answered.
  const [step, setStep] = useState(initialServiceType ? ADDRESS_STEP : 1);
  // Read inside the popstate effect, which is registered once and must not
  // close over a stale step.
  const stepRef = useRef(step);
  stepRef.current = step;
  const jobPreset = initialServiceType ? getServiceType(initialServiceType) : undefined;
  const topRef = useRef<HTMLDivElement>(null);

  // The hero form takes a single line for speed; split it into fields here so
  // the customer lands on the booking step with it already filled in.
  const [pickup, setPickup] = useState<StructuredAddress>(() =>
    initialPickup ? parseAddress(initialPickup) : { ...EMPTY_ADDRESS },
  );
  const [dropoff, setDropoff] = useState<StructuredAddress>(() =>
    initialDropoff ? parseAddress(initialDropoff) : { ...EMPTY_ADDRESS },
  );
  const [dropoffMode, setDropoffMode] = useState<DropoffMode>(
    jobPreset?.defaultDropoffMode ?? "ADDRESS",
  );
  // Coordinates are derived from the addresses by the geocoder, so they live
  // separately and get cleared whenever the address they belong to changes.
  const [pickupPoint, setPickupPoint] = useState<LatLng | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteState | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  // True when one or both ends fell back to a town centre rather than a
  // building, so the UI can say the distance is a ballpark.
  const [approximate, setApproximate] = useState(false);
  const [moveSize, setMoveSize] = useState<MoveSizeValue>(
    initialSize ?? jobPreset?.defaultMoveSize ?? "STUDIO",
  );
  const [tier, setTier] = useState<VehicleTierValue | null>(null);

  const [schedule, setSchedule] = useState<{ dayKey: string; arrivalHour: number | null }>(() => ({
    dayKey: firstBookableDay().key,
    arrivalHour: null,
  }));

  const [items, setItems] = useState<ItemsValue>({
    serviceType: (initialServiceType ?? null) as ServiceTypeValue | null,
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

  // Every step gets a history entry, so the phone's back gesture and the
  // browser's back button walk the wizard instead of leaving the page — which
  // previously threw away everything the customer had typed. Going back in the
  // UI calls history.back() rather than setting state directly, so both routes
  // in and out stay on the same stack and can't disagree.
  //
  // Next's router keeps its own fields on history.state, so spread the existing
  // state rather than replacing it, or its own navigation breaks.
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, bookingStep: 1 }, "");
    if (stepRef.current !== 1) {
      // Arrived on a later step from a homepage job chip. Seed the entry for
      // step 1 underneath it, so the first Back press shows the job list they
      // skipped rather than dropping them back onto the homepage.
      window.history.pushState(
        { ...window.history.state, bookingStep: stepRef.current },
        "",
      );
    }
    function onPopState(event: PopStateEvent) {
      const target = (event.state as { bookingStep?: number } | null)?.bookingStep;
      // No marker means this entry isn't ours — the customer is leaving /book,
      // so let the browser do it.
      if (typeof target !== "number") return;
      setError(null);
      setStep(target);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function goForward(target: number) {
    setError(null);
    setStep(target);
    window.history.pushState({ ...window.history.state, bookingStep: target }, "");
  }

  function goBackTo(target: number) {
    if (target >= step) return;
    setError(null);

    if (target === step - 1) {
      // One step back is a real history step, which keeps this button and the
      // phone's back gesture interchangeable.
      window.history.back();
      return;
    }

    // Jumping several steps can't be expressed as a fixed number of history
    // entries: the customer may have used the browser's own back and forward in
    // between, so the step delta and the stack depth drift apart — and guessing
    // wrong walks them off the page with everything they typed. Push instead.
    // It always lands where they asked, and their next back press returns them
    // to wherever they jumped from.
    setStep(target);
    window.history.pushState({ ...window.history.state, bookingStep: target }, "");
  }

  const matchedCrew = matchCrew(tier);

  // Price is derived, never stored: the running total has to move the moment
  // the customer answers the extra-helper question two steps later, and a
  // number captured when they picked a truck can't do that.
  // What the price is built on. For a job with no second address there's no
  // route to measure, so the mode supplies the trip: none at all for an on-site
  // job, a typical local run when we're the ones choosing the destination.
  const routeInput = routeForMode(dropoffMode, {
    miles: route?.miles ?? null,
    minutes: route?.minutes ?? null,
  });
  const estimate = tier
    ? (quoteForTier(moveSize, routeInput, tier, {
        extraHelper: items.needsHelper === true,
      }) ?? null)
    : null;
  const helperFee = tier ? extraHelperFee(moveSize, tier, routeInput) : null;

  /** Turn the typed address parts into a point on the map. */
  async function resolve(
    value: StructuredAddress,
  ): Promise<{ point: LatLng | null; approx: boolean }> {
    if (!value.street.trim()) return { point: null, approx: false };
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Parts, not a joined string: the Census geocoder is far more accurate
        // when it doesn't have to work out where the street name ends.
        body: JSON.stringify({ street: value.street, city: value.city, zip: value.zip }),
      });
      if (!res.ok) return { point: null, approx: false };
      const { result } = (await res.json()) as {
        result: { lat: number; lng: number; precision: "address" | "city" } | null;
      };
      if (!result) return { point: null, approx: false };
      return {
        point: { lat: result.lat, lng: result.lng },
        approx: result.precision === "city",
      };
    } catch {
      return { point: null, approx: false };
    }
  }

  async function loadRoute() {
    setRoute(null);
    setApproximate(false);
    setLoadingRoute(true);
    try {
      // With no second address there's nothing to route, but the pickup is
      // still worth placing — the map shows where the crew is headed, and a
      // single pin beats an empty panel.
      if (!requiresDropoffAddress(dropoffMode)) {
        const only = await resolve(pickup);
        setApproximate(only.approx);
        setPickupPoint(only.point);
        setDropoffPoint(null);
        return;
      }

      // Geocode whatever doesn't already have coordinates, then route.
      const [from, to] = await Promise.all([resolve(pickup), resolve(dropoff)]);
      if (!from.point || !to.point) return;

      setApproximate(from.approx || to.approx);
      // Keep the resolved coordinates so the map draws pins and the booking
      // records where the job actually is.
      setPickupPoint(from.point);
      setDropoffPoint(to.point);

      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup: from.point, dropoff: to.point }),
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
      if (!items.serviceType) return "Pick what you need a hand with.";
      if (items.serviceType === "OTHER" && !items.serviceTypeOther.trim()) {
        return "Tell us a bit about what you need help with.";
      }
    }
    if (step === ADDRESS_STEP) {
      // Name what's actually missing — "enter an address" on a four-field form
      // leaves the customer hunting for the empty one.
      const missingPickup = missingAddressFields(pickup);
      if (missingPickup.length > 0) {
        return `Pickup address needs a ${missingPickup.join(", ")}.`;
      }
      if (requiresDropoffAddress(dropoffMode)) {
        const missingDropoff = missingAddressFields(dropoff);
        if (missingDropoff.length > 0) {
          return `Drop-off address needs a ${missingDropoff.join(", ")}.`;
        }
      }
    }
    if (step === 3 && !tier) return "Pick a vehicle to continue.";
    if (step === 4 && schedule.arrivalHour === null) return "Choose an arrival window.";
    if (step === 5 && items.needsHelper === null) {
      return "Let us know if you need an extra helper.";
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
    if (step === ADDRESS_STEP) void loadRoute();
    goForward(Math.min(step + 1, TOTAL_STEPS));
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
      pickupAddress: formatAddress(pickup),
      // No second address means dispatch reads what kind of job it is instead
      // of a blank field.
      dropoffAddress: requiresDropoffAddress(dropoffMode)
        ? formatAddress(dropoff)
        : dropoffLabelForMode(dropoffMode),
      dropoffMode,
      moveDate: schedule.dayKey,
      timeWindow: schedule.arrivalHour !== null ? windowLabel(schedule.arrivalHour) : "",
      moveSize,
      serviceType: items.serviceType,
      serviceTypeOther:
        items.serviceType === "OTHER" ? items.serviceTypeOther.trim() : undefined,
      needsHelper: items.needsHelper,
      details: items.details.trim() || undefined,
      city,
      pickupLat: pickupPoint?.lat,
      pickupLng: pickupPoint?.lng,
      dropoffLat: dropoffPoint?.lat,
      dropoffLng: dropoffPoint?.lng,
      distanceMiles: routeInput.miles ?? undefined,
      driveMinutes: routeInput.minutes ?? undefined,
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
      {/* Progress. The finished segments are buttons: on a six-step form the
          fastest way back to something you want to change is to tap it. */}
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Step {step}/{TOTAL_STEPS} · {STEP_LABELS[step - 1]}
      </p>
      <div className="mt-3 flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNumber = i + 1;
          const done = stepNumber < step;
          return (
            <button
              key={i}
              type="button"
              disabled={!done}
              onClick={() => goBackTo(stepNumber)}
              title={done ? `Back to ${STEP_LABELS[i]}` : STEP_LABELS[i]}
              aria-label={
                done
                  ? `Go back to step ${stepNumber}: ${STEP_LABELS[i]}`
                  : `Step ${stepNumber}: ${STEP_LABELS[i]}`
              }
              aria-current={stepNumber === step ? "step" : undefined}
              // Tall enough to hit with a thumb, while the bar itself stays thin.
              className="group flex-1 py-2 disabled:cursor-default"
            >
              <span
                className={`block h-1.5 rounded-full transition ${
                  stepNumber <= step ? "bg-brand" : "bg-black/10"
                } ${done ? "group-hover:bg-brand-cyan" : ""}`}
              />
            </button>
          );
        })}
      </div>

      {/* Who'd be driving. Sits above the step itself: once someone has been
          matched to a real person and a real truck, that's the most reassuring
          thing on the page and shouldn't be below the fold. */}
      {step > 3 && matchedCrew && (
        <div className="mt-8">
          <CrewMatchCard member={matchedCrew} vehicleLabel={getVehicleTier(tier ?? "")?.label} />
        </div>
      )}

      <div className="mt-8">
        {step === 1 && (
          <StepJob
            value={items.serviceType}
            otherText={items.serviceTypeOther}
            onChange={({ serviceType, otherText }) => {
              setError(null);
              // Re-tapping the same option shouldn't wipe choices the customer
              // has since made further down the flow.
              if (serviceType === items.serviceType) {
                setItems((i) => ({ ...i, serviceTypeOther: otherText }));
                return;
              }
              setItems((i) => ({ ...i, serviceType, serviceTypeOther: otherText }));

              // The job implies where things end up and often how big it is.
              // Both stay editable on the steps that own them.
              const preset = getServiceType(serviceType);
              if (preset) {
                setDropoffMode(preset.defaultDropoffMode);
                setDropoffPoint(null);
                setRoute(null);
                if (preset.defaultMoveSize) setMoveSize(preset.defaultMoveSize);
              }
            }}
          />
        )}
        {step === ADDRESS_STEP && (
          <StepAddresses
            pickup={pickup}
            dropoff={dropoff}
            dropoffMode={dropoffMode}
            onChange={({ pickup: p, dropoff: d, dropoffMode: m }) => {
              if (formatAddress(p) !== formatAddress(pickup)) setPickupPoint(null);
              if (formatAddress(d) !== formatAddress(dropoff) || m !== dropoffMode) {
                setDropoffPoint(null);
              }
              setPickup(p);
              setDropoff(d);
              setDropoffMode(m);
              setRoute(null);
            }}
          />
        )}
        {step === 3 && (
          <StepVehicle
            pickupPoint={pickupPoint}
            dropoffPoint={dropoffPoint}
            route={route}
            loadingRoute={loadingRoute}
            approximate={approximate}
            dropoffMode={dropoffMode}
            moveSize={moveSize}
            selectedTier={tier}
            onMoveSizeChange={setMoveSize}
            onSelectTier={(value) => {
              setTier(value);
              setError(null);
            }}
          />
        )}
        {step === 4 && (
          <StepSchedule
            dayKey={schedule.dayKey}
            arrivalHour={schedule.arrivalHour}
            onChange={(next) => {
              setSchedule(next);
              setError(null);
            }}
          />
        )}
        {step === 5 && (
          <StepItems value={items} onChange={setItems} helperFee={helperFee} />
        )}
        {step === 6 && <StepContact value={contact} onChange={setContact} />}
      </div>

      {/* Running total, once there's something to show */}
      {step > 3 && estimate && (
        <p className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-neutral-500">
          Estimate so far:{" "}
          <span className="font-semibold text-ink">
            ${estimate.low}–${estimate.high}
          </span>
          {route && ` · ${route.miles.toFixed(1)} mi`}
          {items.needsHelper === true && helperFee && (
            <span className="mt-1 block text-xs">
              includes +${helperFee.low}–${helperFee.high} for the extra helper
            </span>
          )}
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
            onClick={() => goBackTo(step - 1)}
            className="flex h-14 shrink-0 items-center gap-1.5 rounded-2xl border border-black/15 px-4 font-semibold text-ink transition hover:border-brand/40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        )}
        <button
          type="button"
          onClick={step === TOTAL_STEPS ? submit : next}
          disabled={submitting}
          className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand to-brand-cyan px-6 text-lg font-semibold text-white shadow-md transition enabled:hover:opacity-90 disabled:opacity-50"
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
