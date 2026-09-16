"use client";

import { useState } from "react";
import { TRADES } from "@/lib/texas/trades";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// Longer than the sales application on purpose.
//
// A closer applying from their phone will not fill in eight fields, so /sell
// asks four. A crew is different: engaging the wrong one costs a customer's
// roof, and the three questions that actually decide it — what they do, how
// many of them there are, and whether anything stands behind them if it goes
// wrong — are worth the friction. The insurance answers are also the fastest
// way to end a conversation that was never going to work.

export default function CrewForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);

  function toggleTrade(value: string) {
    setTrades((cur) =>
      cur.includes(value) ? cur.filter((t) => t !== value) : [...cur, value],
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/texas/crews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          city: form.get("city"),
          trades,
          crewSize: form.get("crewSize"),
          dailyCapacity: form.get("dailyCapacity"),
          language: form.get("language"),
          experience: form.get("experience"),
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
          Have your certificate of general liability handy — it&apos;s the first thing
          we&apos;ll ask for, and we can&apos;t put you on a roof without it.
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
      <h2 className="text-xl font-extrabold text-ink">Tell us about your crew</h2>

      <fieldset className="mt-4">
        <legend className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          What do you do?
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
        <input name="name" required placeholder="Your name or company" autoComplete="organization" className={FIELD} />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder="Phone"
          autoComplete="tel"
          className={FIELD}
        />
        <input name="city" placeholder="Which city do you work out of?" className={FIELD} />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="crewSize"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="How many on your crew?"
            className={FIELD}
          />
          <input
            name="dailyCapacity"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Squares a day"
            className={FIELD}
          />
        </div>
        <select name="language" defaultValue="" className={FIELD}>
          <option value="">Language you prefer on the phone</option>
          <option value="English">English</option>
          <option value="Spanish">Español</option>
          <option value="Either">Either is fine</option>
        </select>
        <textarea
          name="experience"
          rows={3}
          placeholder="Who have you been working for, and how long? One or two lines is plenty."
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
          Say no if it&apos;s no — it doesn&apos;t rule you out of the conversation, and we&apos;d
          rather know now than on the morning of a job.
        </p>
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Apply"}
      </button>
      <p className="mt-3 text-xs text-neutral-400">
        1099 subcontractor. You run your own crew, your own hours and your own business.
      </p>
    </form>
  );
}
