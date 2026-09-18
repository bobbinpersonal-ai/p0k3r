"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/partnerPassword";
import { CROSS_SELL_SERVICES } from "@/lib/regions/channelPartners";
import { REGIONS, regionForZip } from "@/lib/regions/states";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// Creating an account directly.
//
// The short form on /channel-partners exists for somebody Kevin has on the
// phone, where every extra field is a reason to hang up. This one is for
// somebody who found us and arrived ready — so it asks for the password up
// front and they never touch a texted link at all.

export default function SignupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zip, setZip] = useState("");
  const [services, setServices] = useState<string[]>(
    CROSS_SELL_SERVICES.filter((s) => s.status === "LIVE").map((s) => s.value),
  );

  const region = regionForZip(zip);
  const outOfArea = zip.replace(/\D/g, "").length >= 5 && !region;

  function toggleService(value: string) {
    setServices((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    if (form.get("password") !== form.get("confirm")) {
      setError("Those two passwords don't match.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/channel-partners/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          phone: form.get("phone"),
          email: form.get("email"),
          password: form.get("password"),
          industry: form.get("industry"),
          city: form.get("city"),
          zip: form.get("zip"),
          approxListSize: form.get("approxListSize"),
          services,
          source: "signup",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't create that account.");
      router.push(body?.redirect || "/channel-partners/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that account.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <input name="businessName" required placeholder="Business name" className={FIELD} />
      <input name="contactName" required placeholder="Your name" className={FIELD} />

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="Phone"
          className={FIELD}
        />
        <input
          name="zip"
          required
          inputMode="numeric"
          maxLength={10}
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className={FIELD}
        />
      </div>

      {outOfArea && (
        <p className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-ink">
          We&apos;re not in that state yet — right now it&apos;s{" "}
          {REGIONS.map((r) => r.name).join(", ")}.
        </p>
      )}
      {region && (
        <p className="text-sm text-brand-cyan">We cover {region.name}. You&apos;re in the area.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="city" placeholder="City" className={FIELD} />
        <input name="industry" placeholder="What you do (HVAC, solar…)" className={FIELD} />
      </div>

      <input
        name="approxListSize"
        inputMode="numeric"
        placeholder="Roughly how many past customers"
        className={FIELD}
      />

      <fieldset className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <legend className="px-1 text-sm font-semibold text-ink">
          What we can offer your customers
        </legend>
        <p className="mb-3 text-xs text-neutral-400">
          Untick anything you do yourself — we won&apos;t quote it.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CROSS_SELL_SERVICES.filter((s) => s.status === "LIVE").map((s) => (
            <label key={s.value} className="flex items-start gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={services.includes(s.value)}
                onChange={() => toggleService(s.value)}
                className="mt-1 h-4 w-4 accent-brand"
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="border-t border-white/10 pt-3">
        <p className="mb-3 text-sm font-semibold text-ink">How you&apos;ll sign back in</p>
        <div className="space-y-3">
          <input
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="username"
            placeholder="Email"
            className={FIELD}
          />
          <input
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            placeholder={`Password (at least ${MIN_PASSWORD_LENGTH} characters)`}
            className={FIELD}
          />
          <input
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Type it again"
            className={FIELD}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-ink"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || outOfArea}
        className="w-full rounded-xl bg-brand px-6 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {busy ? "Creating your account…" : "Create my account"}
      </button>

      <p className="pt-2 text-center text-sm text-neutral-400">
        Already have one?{" "}
        <Link href="/channel-partners/login" className="font-semibold text-brand-cyan hover:text-ink">
          Sign in
        </Link>
      </p>
    </form>
  );
}
