"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/partnerPassword";

export default function ClaimForm({
  token,
  businessName,
  needsEmail,
}: {
  token: string;
  businessName: string;
  needsEmail: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    // Checked here so a mistyped confirmation costs a keystroke rather than a
    // round trip. The server does not see this field at all.
    if (form.get("password") !== form.get("confirm")) {
      setError("Those two passwords don't match.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/channel-partners/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phoneLast4: form.get("phoneLast4"),
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't set that up.");
      router.push(body?.redirect || "/channel-partners/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set that up.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-ink placeholder:text-neutral-500 focus:border-brand focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <div>
        <label htmlFor="phoneLast4" className="block text-sm font-semibold text-ink">
          Last 4 digits of your phone number
        </label>
        <p className="mb-2 mt-1 text-xs text-neutral-400">
          The number we have for {businessName}. This is so a forwarded text can&apos;t claim
          your account.
        </p>
        <input
          id="phoneLast4"
          name="phoneLast4"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          pattern="[0-9]{4}"
          placeholder="0000"
          className={field}
        />
      </div>

      {needsEmail && (
        <input
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="username"
          placeholder="Email to sign in with"
          className={field}
        />
      )}

      <input
        name="password"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        placeholder={`Password (at least ${MIN_PASSWORD_LENGTH} characters)`}
        className={field}
      />
      <input
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
        placeholder="Type it again"
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
        {busy ? "Setting it up…" : "Set my password"}
      </button>
    </form>
  );
}
