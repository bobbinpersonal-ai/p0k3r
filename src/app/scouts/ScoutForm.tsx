"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/regions/states";

// The scout application.
//
// Four fields, because this reader has filled in a lot of long commission-job
// forms that went nowhere, and every extra field here reads as bureaucracy
// from a company that will also be slow to pay. What we actually need is a
// name, a number and one sentence about what they have sold.

const FIELD =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-ink placeholder:text-neutral-500 focus:border-[color:var(--rc)] focus:outline-none focus:ring-1 focus:ring-[color:var(--rc-dim)]";

export default function ScoutForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/intake/scouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          state: form.get("state"),
          experience: form.get("experience"),
          source: "scouts",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't send that.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rc-border rc-fill mt-8 rounded-2xl border p-6">
        <p className="rc-accent font-mono text-xs uppercase tracking-[0.2em]">Received</p>
        <h3 className="mt-2 text-xl font-extrabold text-ink">We&apos;ll call you today.</h3>
        <p className="mt-2 leading-relaxed text-neutral-300">
          It&apos;s a fifteen-minute conversation: what you&apos;ve sold, which businesses
          you&apos;d start with, and you pushing back on the numbers on this page. Bring the
          pushback — the model is ours and it should be argued with.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <input name="name" required autoComplete="name" placeholder="Your name" className={FIELD} />
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
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email (optional)"
          className={FIELD}
        />
      </div>

      {/* [color-scheme:dark] or the native option list renders light text on a
          light popup and is unreadable — same fix as every other select here. */}
      <select name="state" defaultValue="" required className={`${FIELD} [color-scheme:dark]`}>
        <option value="" disabled>
          Where you&apos;d be calling from
        </option>
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
        <option value="OTHER">Somewhere else — I&apos;d call into these states</option>
      </select>

      <textarea
        name="experience"
        rows={3}
        required
        placeholder="What have you sold, and to whom? One or two lines is plenty."
        className={FIELD}
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
        className="rc-glow w-full rounded-xl bg-[#3DE0C0] px-6 py-4 text-base font-bold text-[#08201B] disabled:opacity-60"
      >
        {busy ? "Sending…" : "Apply to scout"}
      </button>

      <p className="pt-1 text-center text-xs leading-relaxed text-neutral-500">
        Independent contractor, paid on production. Nothing here is an offer of employment or a
        guarantee of earnings.
      </p>
    </form>
  );
}
