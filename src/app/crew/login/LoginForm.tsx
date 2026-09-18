"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FIELD =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-ink placeholder:text-neutral-500 focus:border-[color:var(--rc)] focus:outline-none";

export default function CrewLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/crew/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.get("phone"), password: form.get("password") }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't sign you in.");
      router.push(body?.redirect || "/crew");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign you in.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <input
        name="phone"
        type="tel"
        required
        inputMode="tel"
        autoComplete="username"
        placeholder="Your phone number"
        className={FIELD}
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
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
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
