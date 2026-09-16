"use client";

import { useState } from "react";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// Three questions, because a commission-only closer applying from their phone
// on a Tuesday will not fill in eight. Everything else is the phone screen.

export default function SellForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/texas/reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          city: form.get("city"),
          experience: form.get("experience"),
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
          Ten minutes on the phone. Have an answer ready for one question: the last thing you
          sold in somebody&apos;s house, and how it went.
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
      <h2 className="text-xl font-extrabold text-ink">Two minutes</h2>
      <div className="mt-4 space-y-3">
        <input name="name" required placeholder="Name" autoComplete="name" className={FIELD} />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          placeholder="Phone"
          autoComplete="tel"
          className={FIELD}
        />
        <input name="city" placeholder="Which city do you work?" className={FIELD} />
        <textarea
          name="experience"
          rows={3}
          placeholder="What have you sold before? One or two lines is plenty."
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
        disabled={submitting}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Apply"}
      </button>
      <p className="mt-3 text-xs text-neutral-400">
        1099 independent contractor. You set your own hours and work your own appointments.
      </p>
    </form>
  );
}
