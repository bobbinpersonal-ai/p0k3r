"use client";

import { useMemo, useRef, useState } from "react";
import UseMyLocationButton, { type LocationFill } from "@/components/UseMyLocationButton";
import {
  EMPTY_ADDRESS,
  formatAddress,
  isCompleteAddress,
  type StructuredAddress,
} from "@/lib/address";
import {
  bookableServices,
  frequenciesFor,
  quoteLandscaping,
  YARD_SIZES,
  type FrequencyValue,
  type LandscapingServiceValue,
  type YardSizeValue,
} from "@/lib/landscaping";
import {
  firstBookableDay,
  getAvailableWindows,
  getBookableDays,
  windowLabel,
} from "@/lib/arrivalWindows";
import { findCityByName } from "@/lib/cities";
import { balanceAfter, depositFor } from "@/lib/deposit";
import {
  getPaymentMethod,
  isPaidMethod,
  PAYMENT_METHODS,
  paymentLink,
  paymentTarget,
  type PaymentMethodValue,
} from "@/lib/payments";
import QrCode from "@/components/QrCode";
import type { LatLng } from "@/lib/geo";
import type { YardEstimate } from "@/lib/parcel";

// The form we fill in standing on someone's step.
//
// Deliberately not the customer wizard. That flow is five screens because a
// stranger deciding on their own needs to be walked through it; here the
// person holding the phone already knows every answer and the customer is
// waiting, so it's one screen, every field visible, and the price updates as
// we tap. Cutting a five-screen flow to one screen is roughly the difference
// between a two-minute doorstep conversation and a thirty-second one, and the
// thirty-second one is the one that doesn't end with "just leave a card."
//
// It writes an ordinary Booking through the ordinary endpoint — same
// validation, same notifications, same manage link texted to the customer —
// tagged source=door-knock so the afternoon can be judged on what it booked.

const FIELD =
  "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const LABEL = "block text-sm font-semibold text-ink";

/** Big enough to hit with a thumb while holding a clipboard. */
function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
        active
          ? "border-brand bg-brand/15 text-ink"
          : "border-white/10 bg-white/5 text-neutral-200 hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}

type Done = {
  id: string;
  manageUrl: string;
  price: number;
  name: string;
  deposit: number;
  method: PaymentMethodValue;
};

export default function KnockForm() {
  const services = useMemo(() => bookableServices(), []);
  const days = useMemo(() => getBookableDays(), []);

  const [address, setAddress] = useState<StructuredAddress>(EMPTY_ADDRESS);
  const [yardSize, setYardSize] = useState<YardSizeValue>("MEDIUM");
  const [service, setService] = useState<LandscapingServiceValue>(services[0].value);
  const [frequency, setFrequency] = useState<FrequencyValue>("ONE_TIME");
  // Not days[0]: knock a street at five in the afternoon and today has no
  // window left in it, so defaulting to "Today" would offer a date that can't
  // be booked and make the first tap a correction.
  const [dayKey, setDayKey] = useState(() => firstBookableDay().key);
  const [hour, setHour] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [details, setDetails] = useState("");
  // Starts at "not yet" on purpose: a booking claiming money we never took is
  // worse than one that admits we didn't, and a default of Venmo would make
  // that the tap you forget rather than the tap you make.
  const [method, setMethod] = useState<PaymentMethodValue>("NONE");

  const [estimate, setEstimate] = useState<YardEstimate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const point = useRef<LatLng | null>(null);

  const cadences = frequenciesFor(service);
  const quote = quoteLandscaping(service, yardSize, frequency);
  const windows = getAvailableWindows(dayKey);
  const price = quote?.perVisit ?? 0;
  const deposit = depositFor(price);
  const chosen = getPaymentMethod(method);
  const link = paymentLink(method, deposit);
  const target = paymentTarget(method);

  function set(patch: Partial<StructuredAddress>) {
    setAddress((prev) => ({ ...prev, ...patch }));
  }

  /**
   * The GPS fix is taken at the customer's door, so it's the property itself
   * rather than a geocode of typed words — which is exactly what the parcel
   * lookup wants. Never blocks: a refused permission just leaves the fields to
   * be typed.
   */
  async function onLocated(fill: LocationFill) {
    set({ street: fill.street, city: fill.city, zip: fill.zip });
    point.current = fill.point;
    try {
      const res = await fetch("/api/estimate-yard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fill.point),
      });
      if (!res.ok) return;
      const { estimate: found } = (await res.json()) as { estimate: YardEstimate | null };
      if (!found) return;
      setEstimate(found);
      setYardSize(found.yardSize);
    } catch {
      // A size we can't look up is one we ask about, which we were doing anyway.
    }
  }

  function pickService(value: LandscapingServiceValue) {
    setService(value);
    // Cadences differ per service; a one-off-only service can't stay weekly.
    if (!frequenciesFor(value).some((f) => f.value === frequency)) setFrequency("ONE_TIME");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isCompleteAddress(address)) {
      setError("Street, city and ZIP — the crew has to find the place.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Name and phone, or there's nobody to confirm with.");
      return;
    }
    if (hour === null) {
      setError("Pick an arrival window.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceLine: "LANDSCAPING",
          landscapingService: service,
          yardSize,
          frequency,
          pickupAddress: formatAddress(address),
          moveDate: dayKey,
          timeWindow: windowLabel(hour),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          details: details.trim() || undefined,
          city: findCityByName(address.city)?.slug,
          pickupLat: point.current?.lat,
          pickupLng: point.current?.lng,
          source: "door-knock",
          depositMethod: method,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Booking failed. Try again.");
      setDone({
        id: body.id,
        manageUrl: `/manage/${body.manageToken}`,
        price: body.estimateHigh,
        name: customerName.trim(),
        // Read back from the row rather than from the form: the server decides
        // the amount, and the number the rep reads out has to be the number
        // the customer's confirmation will say.
        deposit: body.depositAmount ?? 0,
        method: body.depositMethod ?? "NONE",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /** Everything but the street, so the next house on the block is two taps. */
  function nextDoor() {
    setDone(null);
    setError(null);
    setEstimate(null);
    point.current = null;
    set({ street: "", unit: "" });
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDetails("");
    setHour(null);
    setMethod("NONE");
    window.scrollTo({ top: 0 });
  }

  if (done) {
    const paid = isPaidMethod(done.method);
    const owing = balanceAfter(done.price, done.deposit);
    return (
      <div className="mt-8 rounded-2xl border border-brand/40 bg-brand/10 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          {paid ? "Booked & paid" : "Booked"}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-ink">
          {done.name} — ${done.price}
        </h2>
        {/* Read this back to them before you walk away. It's the same wording
            their confirmation carries, so nothing they read later contradicts
            what they were told on the step. */}
        {paid ? (
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-300">
                Deposit taken ({getPaymentMethod(done.method)?.label})
              </dt>
              <dd className="font-mono font-bold text-ink">${done.deposit}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-300">Due when the work is done</dt>
              <dd className="font-mono font-bold text-ink">${owing}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-neutral-200">
            No deposit taken. A dispatcher calls within 30 minutes to confirm and collect it.
          </p>
        )}
        <p className="mt-3 text-sm text-neutral-200">
          {paid
            ? "Their confirmation is on its way — that message is the receipt."
            : "Confirmation is on its way to their phone."}
        </p>
        <a
          href={done.manageUrl}
          className="mt-4 inline-block font-mono text-sm text-brand-cyan underline"
        >
          Open their booking
        </a>
        <button
          type="button"
          onClick={nextDoor}
          className="mt-5 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white"
        >
          Next door
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-7 pb-32">
      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={LABEL}>Where</h2>
          <UseMyLocationButton
            onResolved={onLocated}
            label="Fill from GPS"
            ariaLabel="Fill the address from this phone's location"
            className="font-mono text-xs uppercase tracking-widest text-brand-cyan"
          />
        </div>
        <input
          value={address.street}
          onChange={(e) => set({ street: e.target.value })}
          placeholder="Street address"
          autoComplete="off"
          className={FIELD}
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <input
            value={address.unit}
            onChange={(e) => set({ unit: e.target.value })}
            placeholder="Unit"
            className={FIELD}
          />
          <input
            value={address.city}
            onChange={(e) => set({ city: e.target.value })}
            placeholder="City"
            className={FIELD}
          />
          <input
            value={address.zip}
            onChange={(e) => set({ zip: e.target.value })}
            placeholder="ZIP"
            inputMode="numeric"
            className={FIELD}
          />
        </div>
      </section>

      <section>
        <h2 className={LABEL}>How big</h2>
        {estimate && (
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-brand-cyan">
            County says ~{estimate.yardSqft.toLocaleString()} sq ft — override if it looks wrong
          </p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {YARD_SIZES.map((size) => (
            <Choice
              key={size.value}
              active={yardSize === size.value}
              onClick={() => setYardSize(size.value)}
            >
              <span className="block font-semibold">{size.label}</span>
              <span className="block text-xs text-neutral-400">{size.areaHint}</span>
            </Choice>
          ))}
        </div>
      </section>

      <section>
        <h2 className={LABEL}>What they need</h2>
        <div className="mt-2 grid gap-2">
          {services.map((card) => {
            const priced = quoteLandscaping(card.value, yardSize, frequency);
            return (
              <Choice
                key={card.value}
                active={service === card.value}
                onClick={() => pickService(card.value)}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{card.label}</span>
                  <span className="font-mono text-base text-brand-cyan">${priced?.perVisit}</span>
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">{card.description}</span>
              </Choice>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className={LABEL}>How often</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cadences.map((cadence) => {
            const priced = quoteLandscaping(service, yardSize, cadence.value);
            return (
              <Choice
                key={cadence.value}
                active={frequency === cadence.value}
                onClick={() => setFrequency(cadence.value)}
              >
                <span className="block font-semibold">{cadence.label}</span>
                <span className="block font-mono text-xs text-brand-cyan">
                  ${priced?.perVisit} a visit
                </span>
              </Choice>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="knock-day" className={LABEL}>
            First visit
          </label>
          <select
            id="knock-day"
            value={dayKey}
            onChange={(e) => {
              setDayKey(e.target.value);
              setHour(null);
            }}
            className={FIELD}
          >
            {days.map((day) => (
              <option key={day.key} value={day.key}>
                {day.isToday ? "Today" : `${day.weekday} ${day.dayOfMonth}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="knock-window" className={LABEL}>
            Arrival window
          </label>
          <select
            id="knock-window"
            value={hour ?? ""}
            onChange={(e) => setHour(e.target.value === "" ? null : Number(e.target.value))}
            className={FIELD}
          >
            <option value="">
              {windows.length === 0 ? "Nothing left that day" : "Pick a time"}
            </option>
            {windows.map((w) => (
              <option key={w.hour} value={w.hour}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="knock-name" className={LABEL}>
            Their name
          </label>
          <input
            id="knock-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            autoComplete="off"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="knock-phone" className={LABEL}>
            Their phone
          </label>
          <input
            id="knock-phone"
            type="tel"
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            autoComplete="off"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="knock-email" className={LABEL}>
            Email <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <input
            id="knock-email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            autoComplete="off"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="knock-details" className={LABEL}>
            Gate code, dogs, what they said
          </label>
          <input
            id="knock-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className={FIELD}
          />
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={LABEL}>Deposit</h2>
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            ${deposit} now · ${balanceAfter(price, deposit)} on the day
          </p>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHODS.map((option) => (
            <Choice
              key={option.value}
              active={method === option.value}
              onClick={() => setMethod(option.value)}
            >
              <span className="block font-semibold">{option.label}</span>
            </Choice>
          ))}
        </div>
        {chosen && (
          <p className="mt-2 text-xs text-neutral-300">{chosen.instruction}</p>
        )}
        {/* The code carries the amount, so it can't be scanned early and it
            can't be wrong. Turn the phone round — they scan it off your
            screen with their own camera. */}
        {link && (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <QrCode
              value={link}
              label={`Scan to pay a $${deposit} deposit`}
              className="h-32 w-32 shrink-0 rounded"
            />
            <div className="min-w-0">
              <p className="text-3xl font-extrabold leading-none text-ink">${deposit}</p>
              {target && (
                <p className="mt-1 break-words font-mono text-sm text-brand-cyan">{target}</p>
              )}
              <p className="mt-2 text-xs text-neutral-400">
                If the camera won&apos;t take it, they can send it to that name by hand —
                it&apos;s the same payment.
              </p>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-brand/50 bg-brand/10 px-3 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      {/* The number gets read out loud, so it stays on screen wherever the
          form is scrolled to. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
              Quote them
            </p>
            <p data-quote className="text-2xl font-extrabold leading-tight text-ink">
              ${price}
              <span className="ml-1 text-xs font-normal text-neutral-300">
                {quote?.frequency.cadence}
              </span>
            </p>
            <p className="font-mono text-[11px] text-brand-cyan">
              {isPaidMethod(method) ? `$${deposit} taken` : `$${deposit} deposit`}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="ml-auto rounded-xl bg-brand px-5 py-4 text-base font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Booking…" : "Book it"}
          </button>
        </div>
      </div>
    </form>
  );
}
