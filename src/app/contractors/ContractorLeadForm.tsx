"use client";

import { useState } from "react";
import { CITIES } from "@/lib/cities";
import {
  type MajorTradeProject,
  MATCH_COUNT,
  REFERRAL_PROMISE,
  type MajorTradeProjectValue,
} from "@/lib/majorTrades";

const inputClass =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// The request form for work we don't do.
//
// Everything about it is deliberately unlike the booking flow: no price, no
// yard size, no arrival window, no "book" button. Those belong to work this
// company performs. This collects enough for a licensed contractor to call
// back — who, where, what, and roughly when — and says plainly, twice, that
// the contractor is independent and the contract is with them.

export default function ContractorLeadForm({
  projects,
  initialProject,
  source,
}: {
  /** The trades we pass on, merged from the shipped list and any edits. */
  projects: readonly MajorTradeProject[];
  initialProject?: MajorTradeProjectValue;
  source?: string;
}) {
  const [project, setProject] = useState<MajorTradeProjectValue | null>(
    initialProject ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!project) {
      setError("Pick the kind of project so we know who to send it to.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const zip = String(form.get("zip") || "").trim();
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a 5-digit ZIP so we can match contractors who cover you.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || "") || undefined,
          zip,
          projectType: project,
          preferredStart: String(form.get("preferredStart") || "") || undefined,
          details: String(form.get("details") || "") || undefined,
          source,
        }),
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
        <h3 className="mt-4 text-lg font-semibold text-ink">Request received</h3>
        <p className="mt-2 text-neutral-300">
          {REFERRAL_PROMISE} They&apos;ll contact you directly, and any work and payment is
          arranged between you and them — we don&apos;t take a deposit or quote this work.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">What&apos;s the project?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {projects.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                project === option.value
                  ? "border-brand bg-brand/10 ring-1 ring-brand"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="projectRadio"
                value={option.value}
                checked={project === option.value}
                onChange={() => setProject(option.value)}
                className="sr-only"
              />
              <span className="font-semibold text-ink">{option.label}</span>
              <span className="mt-1 text-sm text-neutral-300">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-ink">
            Full name
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-ink">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" required className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-ink">
            Email <span className="font-normal text-neutral-300">(optional)</span>
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="zip" className="block text-sm font-semibold text-ink">
            ZIP code
          </label>
          <input
            id="zip"
            name="zip"
            inputMode="numeric"
            maxLength={5}
            required
            placeholder="95814"
            className={inputClass}
          />
          <p className="mt-1.5 text-sm text-neutral-300">
            Decides which contractors see it — we cover{" "}
            {CITIES.slice(0, 3)
              .map((c) => c.name)
              .join(", ")}{" "}
            and nearby.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="preferredStart" className="block text-sm font-semibold text-ink">
          Preferred start date{" "}
          <span className="font-normal text-neutral-300">(optional)</span>
        </label>
        <input
          id="preferredStart"
          name="preferredStart"
          placeholder="e.g. Late October, or as soon as possible"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-semibold text-ink">
          Anything else? <span className="font-normal text-neutral-300">(optional)</span>
        </label>
        <textarea
          id="details"
          name="details"
          rows={3}
          placeholder="Rough scope, budget range, whether you've had other quotes…"
          className={inputClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-cyan px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Request licensed contractor quotes"}
      </button>

      <p className="text-sm text-neutral-300">
        {REFERRAL_PROMISE} They are independent, licensed, bonded and insured — you contract
        with them directly, not with us. Nothing is charged here.
      </p>
    </form>
  );
}
