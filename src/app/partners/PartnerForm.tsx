"use client";

import { useState } from "react";
import { TRADES } from "@/lib/regions/trades";
import { REGIONS, regionForZip, registrationRequired } from "@/lib/regions/states";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// Contractor partner onboarding.
//
// Longer than a homeowner form on purpose. A homeowner who abandons the form
// costs one lead; a partner engaged without the right answers costs a
// customer's house. The three fields that actually decide routing are the
// trade specialties, the base ZIP and the service radius — a network spanning
// rural Wyoming and Johnson County cannot route on city names.
//
// The registration question appears only where the state actually has one.
// Asking every applicant in five states about Kansas roofing registration
// trains them to ignore it; asking a Kansas roofer specifically does not.

export default function PartnerForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [zip, setZip] = useState("");

  const region = regionForZip(zip);
  const outOfArea = zip.replace(/\D/g, "").length >= 5 && !region;
  const needsRegistration = region
    ? trades.map((t) => registrationRequired(region.code, t)).find(Boolean) ?? null
    : null;

  function toggleTrade(value: string) {
    setTrades((cur) => (cur.includes(value) ? cur.filter((t) => t !== value) : [...cur, value]));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          city: form.get("city"),
          baseZip: zip.replace(/\D/g, "").slice(0, 5),
          state: region?.code ?? null,
          serviceRadiusMiles: form.get("serviceRadiusMiles"),
          trades,
          crewSize: form.get("crewSize"),
          registrationNumber: form.get("registrationNumber"),
          experience: form.get("experience"),
          language: form.get("language"),
          hasGeneralLiability: form.get("hasGeneralLiability") === "on",
          hasWorkersComp: form.get("hasWorkersComp") === "on",
          hasW9: form.get("hasW9") === "on",
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
          Have your certificate of general liability handy — it&apos;s the first thing we ask for,
          and we don&apos;t introduce anyone to a homeowner without seeing it.
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
      <h2 className="text-xl font-extrabold text-ink">Join the network</h2>

      <fieldset className="mt-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Trade specialty
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRADES.map((trade) => {
            const on = trades.includes(trade.value);
            return (
              <button
                key={trade.value}
                type="button"
                onClick={() => toggleTrade(trade.value)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  on
                    ? "border-brand-cyan bg-brand-cyan/15 text-ink"
                    : "border-white/15 text-neutral-300 hover:text-ink"
                }`}
              >
                {trade.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 space-y-3">
        <input name="name" required placeholder="Company name" autoComplete="organization" className={FIELD} />
        <input name="phone" type="tel" inputMode="tel" required placeholder="Phone" autoComplete="tel" className={FIELD} />
        <input name="email" type="email" placeholder="Email" autoComplete="email" className={FIELD} />
        <input name="city" placeholder="Town you work out of" className={FIELD} />

        <div>
          <input
            name="baseZip"
            required
            inputMode="numeric"
            maxLength={10}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="Base ZIP code"
            autoComplete="postal-code"
            aria-describedby="partner-zip-note"
            className={FIELD}
          />
          <p
            id="partner-zip-note"
            role={outOfArea ? "alert" : undefined}
            className={`mt-1.5 text-xs ${outOfArea ? "text-brand-cyan" : "text-neutral-400"}`}
          >
            {region
              ? `${region.name}. ${region.licensing.localLicensingCommon ? "Local licensing is the norm there — bring whatever your city or county requires." : "Light on licensing at state level."}`
              : outOfArea
                ? `We're not in that state yet. The network is ${REGIONS.map((r) => r.name).join(", ")}.`
                : `We work ${REGIONS.map((r) => r.code).join(", ")}.`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              name="serviceRadiusMiles"
              type="number"
              min={1}
              max={300}
              inputMode="numeric"
              required
              placeholder="Service radius (miles)"
              className={FIELD}
            />
            <p className="mt-1.5 text-xs text-neutral-400">How far you&apos;ll actually drive.</p>
          </div>
          <div>
            <input
              name="crewSize"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Crew size"
              className={FIELD}
            />
            <p className="mt-1.5 text-xs text-neutral-400">People who turn up.</p>
          </div>
        </div>

        {needsRegistration && (
          <div>
            <input
              name="registrationNumber"
              placeholder="State registration number"
              className={FIELD}
            />
            <p className="mt-1.5 text-xs text-brand-cyan">{needsRegistration}. We verify it.</p>
          </div>
        )}

        <select name="language" defaultValue="" className={FIELD}>
          <option value="">Language you prefer on the phone</option>
          <option value="English">English</option>
          <option value="Spanish">Español</option>
          <option value="Either">Either is fine</option>
        </select>

        <textarea
          name="experience"
          rows={3}
          placeholder="How long have you been doing this, and roughly what do you do in a year?"
          className={FIELD}
        />
      </div>

      <fieldset className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <legend className="px-1 font-mono text-xs uppercase tracking-widest text-neutral-400">
          Paperwork
        </legend>
        {[
          ["hasGeneralLiability", "I carry general liability insurance"],
          ["hasWorkersComp", "I carry workers' compensation"],
          ["hasW9", "I can provide a W-9"],
        ].map(([name, label]) => (
          <label key={name} className="flex items-start gap-2 text-sm text-neutral-200">
            <input type="checkbox" name={name} className="mt-1 h-4 w-4 accent-brand" />
            <span>{label}</span>
          </label>
        ))}
        <p className="pt-1 text-xs text-neutral-400">
          Say no if it&apos;s no. General liability is the one we can&apos;t move on; the others
          we can talk about.
        </p>
      </fieldset>

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
        {submitting ? "Sending…" : outOfArea ? "Not in your state yet" : "Apply to the network"}
      </button>
      <p className="mt-3 text-xs text-neutral-400">
        You stay an independent business. You set your own rates, contract with the homeowner
        directly and run your own crew.
      </p>
    </form>
  );
}
