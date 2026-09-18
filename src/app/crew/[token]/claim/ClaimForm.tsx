"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/partnerPassword";

const FIELD =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-ink placeholder:text-neutral-500 focus:border-[color:var(--rc)] focus:outline-none";

export default function CrewClaimForm({ token, name }: { token: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch("/api/crew/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phoneLast4: form.get("phoneLast4"),
          password: form.get("password"),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't set that up.");
      router.push(body?.redirect || "/crew");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set that up.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <div>
        <label htmlFor="phoneLast4" className="block text-sm font-semibold text-ink">
          Last 4 digits of your phone
        </label>
        <p className="mb-2 mt-1 text-xs text-neutral-400">
          The number the office has for {name}, so a forwarded link can&apos;t take your account.
        </p>
        <input
          id="phoneLast4"
          name="phoneLast4"
          required
          inputMode="numeric"
          maxLength={4}
          pattern="[0-9]{4}"
          placeholder="0000"
          className={FIELD}
        />
      </div>
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
      {error && (
        <p role="alert" className="rounded-xl border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rc-glow w-full rounded-xl bg-[#3DE0C0] px-6 py-4 text-base font-bold text-[#08201B] disabled:opacity-60"
      >
        {busy ? "Setting it up…" : "Set my password"}
      </button>
    </form>
  );
}
