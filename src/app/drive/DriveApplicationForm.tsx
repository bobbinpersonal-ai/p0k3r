"use client";

import { useState } from "react";
import { CITIES } from "@/lib/cities";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function DriveApplicationForm({ initialCity }: { initialCity?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || "") || undefined,
      city: String(form.get("city") || "") || undefined,
      vehicle: String(form.get("vehicle") || ""),
      availability: String(form.get("availability") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-brand/30 bg-brand/10 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-xl text-brand-cyan">
          ✓
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Application received</h3>
        <p className="mt-2 text-slate-400">
          A dispatcher will call or text you to follow up. Thanks for wanting to drive with us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-white">
            Full name
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-white">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" required className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-white">
            Email (optional)
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-semibold text-white">
            City
          </label>
          <select
            id="city"
            name="city"
            defaultValue={initialCity ?? ""}
            className={`${inputClass} [color-scheme:dark]`}
          >
            <option value="" className="bg-ink">
              Not sure yet
            </option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-ink">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="vehicle" className="block text-sm font-semibold text-white">
          What do you drive?
        </label>
        <input
          id="vehicle"
          name="vehicle"
          required
          placeholder="e.g. 2019 F-150 with a hitch, or a 16ft box truck"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="availability" className="block text-sm font-semibold text-white">
          Availability (optional)
        </label>
        <input
          id="availability"
          name="availability"
          placeholder="e.g. Weekends and weekday evenings"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-white">
          Anything else? (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Moving experience, whether you're a UC Davis student, etc."
          className={inputClass}
        />
      </div>

      {error && (
        <p
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
