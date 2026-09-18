"use client";

import { useState } from "react";
import { CROSS_SELL_SERVICES, PREQUALIFICATION, scoreLead } from "@/lib/regions/channelPartners";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// One referral, typed by a contractor who just thought of somebody.
//
// The quality meter updates as they type and never blocks the send. That is a
// deliberate call: a partner with a great customer and no address on hand
// should still be able to submit them, and refusing would cost a real job to
// enforce a preference. It nudges, it doesn't gate.

const BAND_STYLE: Record<string, string> = {
  STRONG: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  WORKABLE: "border-white/15 bg-white/[0.06] text-neutral-200",
  THIN: "border-brand/40 bg-brand/10 text-ink",
};

const BAND_LABEL: Record<string, string> = {
  STRONG: "Strong referral",
  WORKABLE: "Workable",
  THIN: "Thin — worth filling in more",
};

export default function SubmitLeadCard({
  token,
  offeredServices,
}: {
  token: string;
  offeredServices: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [trades, setTrades] = useState<string[]>([]);

  // Only what this partner signed up to offer. Showing them a service we
  // agreed not to sell to their customers would be the exact promise the
  // onboarding made and then broke.
  const menu = CROSS_SELL_SERVICES.filter(
    (s) => s.status === "LIVE" && (offeredServices.length === 0 || offeredServices.includes(s.value)),
  );

  const quality = scoreLead({ address, zip, trades, relationship, notes });

  function reset() {
    setCustomerName("");
    setCustomerPhone("");
    setAddress("");
    setZip("");
    setRelationship("");
    setNotes("");
    setTrades([]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/channel-partners/${token}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          address,
          zip,
          relationship,
          notes,
          trades,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Something went wrong.");
      setSentCount((n) => n + 1);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-extrabold text-ink">Send us a customer</h2>
        {sentCount > 0 && (
          <span className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            {sentCount} sent this visit
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-neutral-300">
        One at a time, whenever somebody comes to mind. Takes about thirty seconds.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          id="lead-name"
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name"
          autoComplete="off"
          className={FIELD}
        />
        <input
          id="lead-phone"
          type="tel"
          inputMode="tel"
          required
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Phone"
          autoComplete="off"
          className={FIELD}
        />
        <input
          id="lead-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street address"
          autoComplete="off"
          className={FIELD}
        />
        <input
          id="lead-zip"
          inputMode="numeric"
          maxLength={10}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="ZIP"
          autoComplete="off"
          className={FIELD}
        />
        <input
          id="lead-relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="What did you do for them, and when?"
          autoComplete="off"
          className={FIELD}
        />

        <fieldset>
          <legend className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            What might they need?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {menu.map((service) => {
              const on = trades.includes(service.value);
              return (
                <button
                  key={service.value}
                  type="button"
                  onClick={() =>
                    setTrades((cur) =>
                      cur.includes(service.value)
                        ? cur.filter((v) => v !== service.value)
                        : [...cur, service.value],
                    )
                  }
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    on
                      ? "border-brand-cyan bg-brand-cyan/15 text-ink"
                      : "border-white/15 text-neutral-300 hover:text-ink"
                  }`}
                >
                  {service.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <textarea
          id="lead-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you noticed — roof looked rough, original windows…"
          className={FIELD}
        />

        {/* The meter. Advisory, and it says so by never disabling the button. */}
        <div className={`rounded-xl border p-3 ${BAND_STYLE[quality.band]}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold">{BAND_LABEL[quality.band]}</span>
            <span className="font-mono text-sm font-bold">{quality.score}</span>
          </div>
          {quality.gaps.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs leading-relaxed">
              {quality.gaps.map((gap) => (
                <li key={gap}>· {gap}</li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send this customer"}
        </button>
      </form>

      <details
        className="group mt-4 rounded-xl border border-white/10 bg-paper/40 p-4"
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:content-none">
          Which of your customers are worth sending?
          <span className="float-right text-neutral-400 group-open:rotate-45">+</span>
        </summary>
        <dl className="mt-3 space-y-3">
          {PREQUALIFICATION.map((item) => (
            <div key={item.signal}>
              <dt className="text-sm font-semibold text-ink">{item.signal}</dt>
              <dd className="text-xs leading-relaxed text-neutral-400">{item.why}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
