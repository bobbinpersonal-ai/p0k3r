"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AcceptTerms() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/channel-partners/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't record that.");
      router.push("/channel-partners/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't record that.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-brand"
        />
        <span className="text-sm leading-relaxed text-neutral-200">
          I&apos;ve read this and I agree to it on behalf of my business.
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-3 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!checked || busy}
        onClick={accept}
        className="mt-4 w-full rounded-xl bg-brand px-6 py-4 text-base font-bold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Agree and open my page"}
      </button>
      <p className="mt-3 text-center text-xs text-neutral-500">
        We record the date and version you agreed to.
      </p>
    </div>
  );
}
