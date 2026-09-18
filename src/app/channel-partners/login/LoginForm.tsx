"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/channel-partners/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't sign you in.");
      router.push(body?.redirect || "/channel-partners/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign you in.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-ink placeholder:text-neutral-500 focus:border-brand focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <input
        name="email"
        type="email"
        required
        autoComplete="username"
        inputMode="email"
        placeholder="Email"
        className={field}
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        className={field}
      />

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
        disabled={busy}
        className="w-full rounded-xl bg-brand px-6 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="pt-2 text-center text-sm text-neutral-400">
        Haven&apos;t set a password?{" "}
        <span className="text-neutral-300">
          Open the link we texted you and there&apos;s a button on it.
        </span>
      </p>
      <p className="text-center text-sm text-neutral-400">
        No account yet?{" "}
        <Link href="/channel-partners/signup" className="font-semibold text-brand-cyan hover:text-ink">
          Create one
        </Link>
      </p>
    </form>
  );
}
