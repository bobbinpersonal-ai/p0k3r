"use client";

import { useState } from "react";
import { REGIONS, regionForZip } from "@/lib/regions/states";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// Channel partner application.
//
// Doesn't ask for the list itself — see the route's own comment for why.
// This just gets enough on record to call them back and have the real
// conversation about what they can actually share and how.

export default function ChannelPartnerForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zip, setZip] = useState("");

  const region = regionForZip(zip);
  const outOfArea = zip.replace(/\D/g, "").length >= 5 && !region;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/channel-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          phone: form.get("phone"),
          email: form.get("email"),
          industry: form.get("industry"),
          city: form.get("city"),
          zip: zip.replace(/\D/g, "").slice(0, 5),
          state: region?.code ?? null,
          approxListSize: form.get("approxListSize"),
          notes: form.get("notes"),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div id="apply" className="scroll-mt-24 rounded-2xl border border-brand/40 bg-brand/10 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">In</p>
        <h2 className="mt-2 text-xl font-extrabold text-ink">We&apos;ll call you today.</h2>
        <p className="mt-2 text-sm text-neutral-200">
          We&apos;ll walk through what you can share and how before anything changes hands.
          Nothing about your list moves until you say so.
        </p>
      </div>
    );
  }

  return (
    <form
      id="apply"
      onSubmit={submit}
      className="scroll-mt-24 rounded-2xl border border-white/10 bg-paper/80 p-5"
    >
      <h2 className="text-xl font-extrabold text-ink">Apply as a channel partner</h2>

      <div className="mt-4 space-y-3">
        <input
          name="businessName"
          required
          placeholder="Business name"
          autoComplete="organization"
          className={FIELD}
        />
        <input name="contactName" required placeholder="Your name" autoComplete="name" className={FIELD} />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder="Phone"
          autoComplete="tel"
          className={FIELD}
        />
        <input name="email" type="email" placeholder="Email" autoComplete="email" className={FIELD} />
        <input
          name="industry"
          placeholder="What's your business? (solar, security, HVAC, pest control...)"
          className={FIELD}
        />
        <input name="city" placeholder="Town you work out of" className={FIELD} />

        <div>
          <input
            name="zip"
            required
            inputMode="numeric"
            maxLength={10}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            autoComplete="postal-code"
            aria-describedby="channel-partner-zip-note"
            className={FIELD}
          />
          <p
            id="channel-partner-zip-note"
            role={outOfArea ? "alert" : undefined}
            className={`mt-1.5 text-xs ${outOfArea ? "text-brand-cyan" : "text-neutral-400"}`}
          >
            {region
              ? `${region.name}. We're already working there.`
              : outOfArea
                ? `We're not in that state yet. We work ${REGIONS.map((r) => r.name).join(", ")}.`
                : `We work ${REGIONS.map((r) => r.code).join(", ")}.`}
          </p>
        </div>

        <input
          name="approxListSize"
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="Roughly how many customers?"
          className={FIELD}
        />

        <textarea
          name="notes"
          rows={3}
          placeholder="Anything else worth knowing — how you know them, how recent, how you'd reach them?"
          className={FIELD}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || outOfArea}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : outOfArea ? "Not in your state yet" : "Apply now"}
      </button>
      <p className="mt-3 text-xs text-neutral-400">
        This doesn&apos;t send us your customer list — just enough to call you back and talk
        through it.
      </p>
    </form>
  );
}
