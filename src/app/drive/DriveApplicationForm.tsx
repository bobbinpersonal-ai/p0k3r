"use client";

import { useState } from "react";
import { CITIES } from "@/lib/cities";
import { APPLICANT_ROLES, type ApplicantRole } from "@/lib/applicantRoles";
import { PAYOUT_METHODS, getPayoutMethodPlaceholder, type PayoutMethodValue } from "@/lib/payoutMethods";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-slate-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function DriveApplicationForm({
  initialCity,
  initialRole,
  source,
}: {
  initialCity?: string;
  initialRole?: ApplicantRole;
  source?: string;
}) {
  const [role, setRole] = useState<ApplicantRole | null>(initialRole ?? null);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Let us know whether you're applying as a driver or a helper.");
      return;
    }

    if (!payoutMethod) {
      setError("Let us know how you want to get paid.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const payoutHandle = String(form.get("payoutHandle") || "").trim();

    if (!payoutHandle) {
      setError("Let us know your Zelle, Venmo, or Apple Pay info.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || "") || undefined,
      city: String(form.get("city") || "") || undefined,
      role,
      vehicle: String(form.get("vehicle") || "") || undefined,
      payoutMethod,
      payoutHandle,
      availability: String(form.get("availability") || "") || undefined,
      notes: String(form.get("notes") || "") || undefined,
      source,
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
          We&apos;ll get to your application and get you onboarded — usually within 2 hours,
          9am–9pm. Thanks for wanting to work with us.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-white">
          I want to apply as a...
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {APPLICANT_ROLES.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                role === option.value
                  ? "border-brand bg-brand/10 ring-1 ring-brand"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="roleRadio"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="font-semibold text-white">{option.label}</span>
              <span className="mt-1 text-sm text-slate-400">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

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

      {role === "DRIVER" && (
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
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-white">
          How do you want to get paid?
        </legend>
        <p className="mt-1 text-sm text-slate-400">
          You&apos;re paid out by 5pm (or sooner) every day you work.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PAYOUT_METHODS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                payoutMethod === option.value
                  ? "border-brand bg-brand/10 ring-1 ring-brand"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="payoutMethodRadio"
                value={option.value}
                checked={payoutMethod === option.value}
                onChange={() => setPayoutMethod(option.value)}
                className="sr-only"
              />
              <span className="font-semibold text-white">{option.label}</span>
            </label>
          ))}
        </div>
        {payoutMethod && (
          <input
            name="payoutHandle"
            required
            placeholder={getPayoutMethodPlaceholder(payoutMethod)}
            className={`${inputClass} mt-3`}
          />
        )}
      </fieldset>

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
