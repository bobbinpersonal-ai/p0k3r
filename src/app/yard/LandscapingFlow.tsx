"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StepYardService from "@/app/yard/steps/StepYardService";
import StepYardSize from "@/app/yard/steps/StepYardSize";
import StepYardAddress from "@/app/yard/steps/StepYardAddress";
import StepSchedule from "@/app/book/steps/StepSchedule";
import StepContact, { type ContactValue } from "@/app/book/steps/StepContact";
import CrewMatchCard from "@/components/CrewMatchCard";
import {
  EMPTY_ADDRESS,
  formatAddress,
  missingAddressFields,
  parseAddress,
  type StructuredAddress,
} from "@/lib/address";
import {
  DEFAULT_FREQUENCY,
  getLandscapingService,
  quoteLandscaping,
  type FrequencyValue,
  type LandscapingServiceValue,
  type YardSizeValue,
} from "@/lib/landscaping";
import { firstBookableDay, windowLabel } from "@/lib/arrivalWindows";
import { matchCrew } from "@/lib/crew";
import { trackBookingConversion } from "@/lib/analytics";
import { getCity } from "@/lib/cities";
import type { LatLng } from "@/lib/geo";

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");

// The yard-work booking wizard: what → how big and how often → where → when →
// who you are.
//
// A sibling of BookingFlow rather than a mode inside it. The two share their
// last two steps and their history handling, and nothing else: this one has no
// route to measure, no vehicle to pick, and no second address, and its price is
// settled on step 2 instead of accumulating across four. Folding both into one
// component would have meant a `serviceLine === "LANDSCAPING"` branch in
// roughly every function in the file, on the flow that most of the business now
// depends on. Two readable flows beat one that has to be traced twice.

const TOTAL_STEPS = 5;

/** Which step collects the address — the one that triggers geocoding. */
const ADDRESS_STEP = 3;

const STEP_LABELS = ["What you need", "Your yard", "Address", "Arrival time", "Your info"];

export default function LandscapingFlow({
  initialService,
  initialYardSize,
  initialFrequency,
  initialAddress,
  city,
  source,
}: {
  /** Set when they tapped a service on the homepage, so we don't ask again. */
  initialService?: LandscapingServiceValue;
  initialYardSize?: YardSizeValue;
  initialFrequency?: FrequencyValue;
  initialAddress?: string;
  city?: string;
  /** Which marketing channel sent them here, from ?source= — see src/lib/sources.ts. */
  source?: string;
}) {
  const router = useRouter();
  // Arriving from a homepage service card means step 1 is already answered.
  const [step, setStep] = useState(initialService ? 2 : 1);
  const cityName = city ? getCity(city)?.name : undefined;
  const stepRef = useRef(step);
  stepRef.current = step;
  const topRef = useRef<HTMLDivElement>(null);

  const [service, setService] = useState<LandscapingServiceValue | null>(initialService ?? null);
  const [yardSize, setYardSize] = useState<YardSizeValue | null>(initialYardSize ?? null);
  const [frequency, setFrequency] = useState<FrequencyValue>(initialFrequency ?? DEFAULT_FREQUENCY);

  const [address, setAddress] = useState<StructuredAddress>(() =>
    initialAddress ? parseAddress(initialAddress) : { ...EMPTY_ADDRESS },
  );
  const [point, setPoint] = useState<LatLng | null>(null);
  // The lookup started when they left the address step. Held so submit can wait
  // on it: it's kicked off two steps early precisely so it's finished by then,
  // but on a slow connection "finished by then" isn't a guarantee, and dispatch
  // losing the pin is a worse outcome than a half-second on the button.
  const locating = useRef<Promise<void> | null>(null);
  // Read by submit right after awaiting the lookup, when the state set by it
  // hasn't re-rendered yet and `point` still holds the previous value.
  const pointRef = useRef<LatLng | null>(null);

  const [schedule, setSchedule] = useState<{ dayKey: string; arrivalHour: number | null }>(() => ({
    dayKey: firstBookableDay().key,
    arrivalHour: null,
  }));

  const [details, setDetails] = useState("");
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

  // Every step gets a history entry, so the phone's back gesture walks the
  // wizard instead of leaving the page and throwing away what was typed. Same
  // approach as BookingFlow — see the long comment there.
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, yardStep: 1 }, "");
    if (stepRef.current !== 1) {
      window.history.pushState({ ...window.history.state, yardStep: stepRef.current }, "");
    }
    function onPopState(event: PopStateEvent) {
      const target = (event.state as { yardStep?: number } | null)?.yardStep;
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
    window.history.pushState({ ...window.history.state, yardStep: target }, "");
  }

  function goBackTo(target: number) {
    if (target >= step) return;
    setError(null);
    if (target === step - 1) {
      window.history.back();
      return;
    }
    setStep(target);
    window.history.pushState({ ...window.history.state, yardStep: target }, "");
  }

  const quote = service && yardSize ? quoteLandscaping(service, yardSize, frequency) : undefined;

  // Where the job is, so the crew match has something real to measure from.
  // Coordinates once geocoded; the typed city until then.
  const jobLocation = point ?? address.city ?? city ?? null;
  const matchedCrew = matchCrew(null, jobLocation);

  /** Place the property on the map so dispatch sees where it is. */
  async function locate(): Promise<void> {
    if (!address.street.trim()) return;
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street: address.street, city: address.city, zip: address.zip }),
      });
      if (!res.ok) return;
      const { result } = (await res.json()) as {
        result: { lat: number; lng: number } | null;
      };
      if (result) {
        const resolved = { lat: result.lat, lng: result.lng };
        pointRef.current = resolved;
        setPoint(resolved);
      }
    } catch {
      // The price doesn't depend on this — a failed lookup just means dispatch
      // reads the typed address instead of a pin.
    }
  }

  function canAdvance(): string | null {
    if (step === 1 && !service) return "Pick what the yard needs.";
    if (step === 2 && !yardSize) return "Pick roughly how big the yard is.";
    if (step === ADDRESS_STEP) {
      const missing = missingAddressFields(address);
      if (missing.length > 0) return `The address needs a ${missing.join(", ")}.`;
    }
    if (step === 4 && schedule.arrivalHour === null) return "Choose an arrival window.";
    return null;
  }

  function next() {
    const problem = canAdvance();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (step === ADDRESS_STEP) locating.current = locate();
    goForward(Math.min(step + 1, TOTAL_STEPS));
  }

  async function submit() {
    if (!contact.customerName.trim() || !contact.customerPhone.trim()) {
      setError("We need a name and phone number to confirm your visit.");
      return;
    }
    setError(null);
    setSubmitting(true);

    // Never fails — locate() swallows its own errors — so this only ever costs
    // the time the lookup still needs.
    await locating.current;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceLine: "LANDSCAPING",
          ...contact,
          customerEmail: contact.customerEmail.trim() || undefined,
          landscapingService: service,
          yardSize,
          frequency,
          pickupAddress: formatAddress(address),
          moveDate: schedule.dayKey,
          timeWindow: schedule.arrivalHour !== null ? windowLabel(schedule.arrivalHour) : "",
          details: details.trim() || undefined,
          city,
          pickupLat: pointRef.current?.lat,
          pickupLng: pointRef.current?.lng,
          source,
        }),
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
      {/* The h1 stays in the DOM on every step — a real page needs exactly one,
          and the per-step h2 isn't it — but only takes up space on step 1,
          where nothing else says what this page is. Same reasoning as
          BookingFlow. */}
      <h1 className={step === 1 ? "text-3xl font-extrabold tracking-tight text-ink" : "sr-only"}>
        Book your {cityName ? `${cityName} ` : ""}yard service
      </h1>
      {step === 1 && (
        <>
          <p className="mt-2 text-neutral-500">
            Pick the job and the size of your yard and you&apos;ll see the price right here —
            flat, not a &ldquo;starting at.&rdquo; Takes about a minute.
          </p>
          <p className="mt-2">
            <a
              href={`tel:${SUPPORT_PHONE_DIGITS}`}
              className="font-mono text-sm text-brand-cyan hover:text-ink"
            >
              Prefer to book by phone? Call {SUPPORT_PHONE}
            </a>
          </p>
        </>
      )}

      <p
        className={`font-mono text-xs uppercase tracking-widest text-brand-cyan ${
          step === 1 ? "mt-6" : ""
        }`}
      >
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

      {/* Who'd be doing the work, once there's an address to match against. */}
      {step > ADDRESS_STEP && matchedCrew && (
        <div className="mt-8">
          <CrewMatchCard match={matchedCrew} trade="yard" />
        </div>
      )}

      <div className="mt-8">
        {step === 1 && (
          <StepYardService
            value={service}
            onChange={(value) => {
              setError(null);
              setService(value);
              // A cadence chosen for mowing means nothing on a sod install, and
              // leaving it set would price the new job against a discount it
              // can't have.
              if (!getLandscapingService(value)?.allowsRecurring) setFrequency("ONE_TIME");
            }}
          />
        )}
        {step === 2 && service && (
          <StepYardSize
            service={service}
            yardSize={yardSize}
            frequency={frequency}
            onChange={({ yardSize: size, frequency: cadence }) => {
              setError(null);
              setYardSize(size);
              setFrequency(cadence);
            }}
          />
        )}
        {step === ADDRESS_STEP && (
          <StepYardAddress
            value={address}
            onChange={(next) => {
              // A changed address invalidates the pin we geocoded from the old
              // one — better no pin than one pointing at the wrong house.
              if (formatAddress(next) !== formatAddress(address)) {
                pointRef.current = null;
                setPoint(null);
              }
              setAddress(next);
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
        {step === TOTAL_STEPS && (
          <>
            <StepContact value={contact} onChange={setContact} />
            <div className="mt-5">
              <label htmlFor="yardDetails" className="block text-sm font-semibold text-ink">
                Anything we should know?{" "}
                <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <textarea
                id="yardDetails"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Gate code, dog in the yard, where to park, sprinklers to avoid…"
                className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </>
        )}
      </div>

      {/* The price, restated on the last step so nobody submits without seeing
          the number they're agreeing to. It hasn't moved since step 2 — that's
          the point of pricing flat — so this is a reminder, not a reveal. */}
      {step === TOTAL_STEPS && quote && (
        <p className="mt-8 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-neutral-500">
          <span className="font-semibold text-ink">${quote.perVisit}</span>
          {quote.frequency.visitsPerMonth === null
            ? " · one visit"
            : ` · per visit, ${quote.frequency.cadence} · about $${quote.monthlyTotal} a month`}
          {` · ${quote.service.label.toLowerCase()}, ${quote.yardSize.label.toLowerCase()} yard`}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 text-sm text-brand">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => goBackTo(step - 1)}
            className="flex h-14 shrink-0 items-center gap-1.5 rounded-2xl border border-black/15 px-4 font-semibold text-ink transition hover:border-brand/40"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
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
          {step === TOTAL_STEPS ? (submitting ? "Booking…" : "Book my visit") : "Continue"}
        </button>
      </div>

      {step === TOTAL_STEPS && (
        <p className="mt-4 text-sm text-neutral-500">
          No charge now — a dispatcher confirms your crew and the time before anyone drives
          out.
        </p>
      )}
    </div>
  );
}
