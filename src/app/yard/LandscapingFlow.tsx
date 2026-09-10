"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StepYardAddress from "@/app/yard/steps/StepYardAddress";
import StepYardSize from "@/app/yard/steps/StepYardSize";
import StepYardServices from "@/app/yard/steps/StepYardServices";
import StepSchedule from "@/app/book/steps/StepSchedule";
import StepContact, { type ContactValue } from "@/app/book/steps/StepContact";
import CrewMatchCard from "@/components/CrewMatchCard";
import {
  EMPTY_ADDRESS,
  formatAddress,
  isLocatableAddress,
  missingDoorFields,
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
import type { YardEstimate } from "@/lib/parcel";

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_PHONE_DIGITS = SUPPORT_PHONE.replace(/[^\d+]/g, "");

// The yard-work booking wizard: where → how big → what it needs → when → who.
//
// Address first, on purpose. It lets the parcel lookup take a run at the yard
// size before we ask for it (see src/lib/parcel.ts), and it means the first
// price anyone sees is already theirs — priced against their yard, on the
// services step, rather than a "from $X" they have to mentally adjust. Nothing
// before that step quotes a number, which is also why the marketing pages only
// ever say "from".
//
// A sibling of BookingFlow rather than a mode inside it. The two share their
// last two steps and their history handling, and nothing else: this one has no
// route to measure, no vehicle to pick, and no second address, and its price is
// settled on step 2 instead of accumulating across four. Folding both into one
// component would have meant a `serviceLine === "LANDSCAPING"` branch in
// roughly every function in the file, on the flow that most of the business now
// depends on. Two readable flows beat one that has to be traced twice.

const TOTAL_STEPS = 5;

/** The address leads, so geocoding and the parcel lookup start immediately. */
const ADDRESS_STEP = 1;
const SIZE_STEP = 2;
const SERVICES_STEP = 3;
const SCHEDULE_STEP = 4;

const STEP_LABELS = ["Address", "Your yard", "What you need", "Arrival time", "Your info"];

export default function LandscapingFlow({
  initialService,
  initialYardSize,
  initialFrequency,
  initialAddress,
  initialPoint,
  city,
  source,
  embedded = false,
  onStepChange,
}: {
  /** Set when they tapped a service on the homepage, so we don't ask again. */
  initialService?: LandscapingServiceValue;
  initialYardSize?: YardSizeValue;
  initialFrequency?: FrequencyValue;
  initialAddress?: string;
  /**
   * A real GPS fix from the hero's "use my location", when there was one.
   *
   * Worth more than the address text it came with: it's the actual building,
   * where re-geocoding those words can land on a town centre and take the
   * parcel lookup with it. When this is present the flow skips geocoding.
   */
  initialPoint?: { lat: number; lng: number };
  city?: string;
  /** Which marketing channel sent them here, from ?source= — see src/lib/sources.ts. */
  source?: string;
  /**
   * Rendered inside another page rather than as the page itself.
   *
   * Two things change. The heading drops to an h2, because the host page
   * already has the h1 and a document with two is a document with none. And
   * the mount-time scroll is skipped: on its own page that scroll is a no-op,
   * but embedded in a homepage hero it would yank a visitor down to the form
   * before they've read a word.
   */
  embedded?: boolean;
  /** Lets the host page react to progress — see HeroBooking. */
  onStepChange?: (step: number) => void;
}) {
  const router = useRouter();
  const initialAddressParts = initialAddress ? parseAddress(initialAddress) : null;
  // Don't ask twice. Someone who typed an address into the hero — or tapped
  // "use my location" there — has already answered step 1, and re-presenting
  // it as four empty-looking fields reads as though the first one didn't
  // count. A house number they didn't give isn't a reason to hold them here:
  // it's collected once at the end, where they've seen a price and decided
  // they want it. See canAdvance and the door-details block on the last step.
  const [step, setStep] = useState(
    initialAddressParts && isLocatableAddress(initialAddressParts) ? SIZE_STEP : 1,
  );
  const cityName = city ? getCity(city)?.name : undefined;
  const stepRef = useRef(step);
  stepRef.current = step;
  const topRef = useRef<HTMLDivElement>(null);

  const [service, setService] = useState<LandscapingServiceValue | null>(initialService ?? null);
  const [yardSize, setYardSize] = useState<YardSizeValue | null>(initialYardSize ?? null);
  const [frequency, setFrequency] = useState<FrequencyValue>(initialFrequency ?? DEFAULT_FREQUENCY);

  const [address, setAddress] = useState<StructuredAddress>(
    () => initialAddressParts ?? { ...EMPTY_ADDRESS },
  );
  const [point, setPoint] = useState<LatLng | null>(initialPoint ?? null);
  const [estimate, setEstimate] = useState<YardEstimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  // True once the customer has touched the size themselves, so a late-arriving
  // estimate can never overwrite an answer they already gave.
  const sizeTouched = useRef(false);
  // The lookup started when they left the address step. Held so submit can wait
  // on it: it's kicked off two steps early precisely so it's finished by then,
  // but on a slow connection "finished by then" isn't a guarantee, and dispatch
  // losing the pin is a worse outcome than a half-second on the button.
  const locating = useRef<Promise<void> | null>(null);
  // Read by submit right after awaiting the lookup, when the state set by it
  // hasn't re-rendered yet and `point` still holds the previous value.
  const pointRef = useRef<LatLng | null>(initialPoint ?? null);

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

  // Keep each new step starting at its heading rather than mid-page. Embedded,
  // the first render is skipped — the host page owns where the visitor starts,
  // and scrolling them to the form on arrival is the opposite of helpful.
  const lastScrolledStep = useRef(step);
  useEffect(() => {
    // Embedded, the step we opened on is the host page's business — only a
    // step the customer actually moved to is worth scrolling to.
    if (embedded && lastScrolledStep.current === step) return;
    lastScrolledStep.current = step;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, embedded]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // Arriving with an address from the hero skips step 1, and with it the
  // lookup that step normally triggers. Run it once on mount instead, so the
  // size question is still pre-answered for the people who took the shortcut.
  useEffect(() => {
    if (stepRef.current === 1) return;
    locating.current = pointRef.current ? guessYardSize(pointRef.current) : locate();
    // Mount only: later address edits re-trigger this through next().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        await guessYardSize(resolved);
      }
    } catch {
      // The price doesn't depend on this — a failed lookup just means dispatch
      // reads the typed address instead of a pin.
    }
  }

  /**
   * Ask the county how big the lot is, and pre-select a size from it.
   *
   * Never fails loudly and never overrides the customer: a null answer (an
   * uncovered county, a slow service, a geocode that landed on a town centre)
   * just leaves the size question exactly as it was, and an answer that arrives
   * after they've already picked is discarded.
   */
  async function guessYardSize(at: LatLng) {
    setEstimating(true);
    try {
      const res = await fetch("/api/estimate-yard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: at.lat, lng: at.lng }),
      });
      if (!res.ok) return;
      const { estimate: found } = (await res.json()) as { estimate: YardEstimate | null };
      if (!found) return;
      setEstimate(found);
      if (!sizeTouched.current) setYardSize(found.yardSize);
    } catch {
      // See above — no estimate is a normal outcome, not an error.
    } finally {
      setEstimating(false);
    }
  }

  function canAdvance(): string | null {
    if (step === ADDRESS_STEP && !isLocatableAddress(address)) {
      // Deliberately the lightest possible gate: a town or a ZIP. Everything
      // after this only needs to know roughly where the property is.
      return "Add a city or ZIP so we know where the yard is.";
    }
    if (step === SIZE_STEP && !yardSize) return "Pick roughly how big the yard is.";
    if (step === SERVICES_STEP && !service) return "Pick what the yard needs.";
    if (step === SCHEDULE_STEP && schedule.arrivalHour === null) {
      return "Choose an arrival window.";
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
    if (step === ADDRESS_STEP) {
      locating.current = pointRef.current
        ? guessYardSize(pointRef.current)
        : locate();
    }
    goForward(Math.min(step + 1, TOTAL_STEPS));
  }

  async function submit() {
    if (!contact.customerName.trim() || !contact.customerPhone.trim()) {
      setError("We need a name and phone number to confirm your visit.");
      return;
    }
    const missingDoor = missingDoorFields(address);
    if (missingDoor.length > 0) {
      setError(`Add your ${missingDoor.join(" and ")} so the crew can find you.`);
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
    <div ref={topRef} className={embedded ? "scroll-mt-24" : "mt-8 scroll-mt-24"}>
      {/* The h1 stays in the DOM on every step — a real page needs exactly one,
          and the per-step h2 isn't it — but only takes up space on step 1,
          where nothing else says what this page is. Same reasoning as
          BookingFlow. */}
      {/* The host page owns the h1 when embedded, so this drops to an h2
          there rather than giving the document two. */}
      {embedded ? (
        <h2 className="sr-only">Get your {cityName ? `${cityName} ` : ""}yard priced</h2>
      ) : (
        <h1 className={step === 1 ? "text-3xl font-extrabold tracking-tight text-ink" : "sr-only"}>
          Get your {cityName ? `${cityName} ` : ""}yard priced
        </h1>
      )}
      {step === 1 && !embedded && (
        <>
          <p className="mt-2 text-neutral-500">
            Tell us where the yard is and roughly how big it is, and we&apos;ll show you
            every service priced for it — flat, not a &ldquo;starting at.&rdquo; Takes about
            a minute, and nothing is charged here.
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
      {step > SIZE_STEP && matchedCrew && (
        <div className="mt-8">
          <CrewMatchCard match={matchedCrew} trade="yard" />
        </div>
      )}

      <div className="mt-8">
        {step === ADDRESS_STEP && (
          <StepYardAddress
            value={address}
            onChange={(next) => {
              // A changed address invalidates both the pin we geocoded from the
              // old one and any estimate built on it — better nothing than
              // either pointing at the wrong house.
              if (formatAddress(next) !== formatAddress(address)) {
                pointRef.current = null;
                setPoint(null);
                setEstimate(null);
              }
              setAddress(next);
            }}
          />
        )}
        {step === SIZE_STEP && (
          <StepYardSize
            value={yardSize}
            estimate={estimate}
            estimating={estimating}
            onChange={(size) => {
              setError(null);
              sizeTouched.current = true;
              setYardSize(size);
            }}
          />
        )}
        {step === SERVICES_STEP && yardSize && (
          <StepYardServices
            yardSize={yardSize}
            service={service}
            frequency={frequency}
            onChange={({ service: picked, frequency: cadence }) => {
              setError(null);
              setService(picked);
              setFrequency(cadence);
            }}
          />
        )}
        {step === SCHEDULE_STEP && (
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

            {/* Asked here and nowhere earlier. A house number does nothing for
                the price — it matters to the person knocking on the day — so
                demanding it before anyone has seen a number turns a quote into
                a form argument. By this point they've seen the price and
                decided they want it, which is when it's reasonable to ask. */}
            {missingDoorFields(address).length > 0 && (
              <div className="mt-5 rounded-2xl border border-brand/30 bg-brand/5 p-4">
                <p className="text-sm font-semibold text-ink">
                  Don&apos;t forget your house number
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  We&apos;ve got{" "}
                  <span className="font-medium text-ink">
                    {[address.city.trim(), address.zip.trim()].filter(Boolean).join(" ") ||
                      "your area"}
                  </span>
                  . The crew needs the rest to find the door.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem]">
                  <input
                    value={address.street}
                    autoComplete="address-line1"
                    placeholder="House number and street"
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <input
                    value={address.zip}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    placeholder="ZIP"
                    onChange={(e) =>
                      setAddress({
                        ...address,
                        zip: e.target.value.replace(/\D/g, "").slice(0, 5),
                      })
                    }
                    className="w-full rounded-xl border border-black/10 bg-black/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <input
                  value={address.unit}
                  autoComplete="address-line2"
                  placeholder="Apt / unit / gate code (optional)"
                  onChange={(e) => setAddress({ ...address, unit: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-black/5 px-3 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

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
          {step === TOTAL_STEPS
            ? submitting
              ? "Sending…"
              : "Request this booking"
            : "Continue"}
        </button>
      </div>

      {step === TOTAL_STEPS && (
        <p className="mt-4 text-sm text-neutral-500">
          Nothing is charged here. We&apos;ll call you{" "}
          <span className="font-semibold text-ink">within 30 minutes</span> to confirm the
          job and take a deposit to get you on the schedule — the rest is due when the work
          is done.
        </p>
      )}
    </div>
  );
}
