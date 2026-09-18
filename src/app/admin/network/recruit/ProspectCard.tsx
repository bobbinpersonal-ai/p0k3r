"use client";

import { useState, useTransition } from "react";
import {
  PROSPECT_ACTIONS,
  followUpEmail,
  followUpText,
  getProspectTrade,
  MIN_VIABLE_LIST,
} from "@/lib/regions/partnerProspects";
import { logCall, setListSize } from "./actions";
import { useRecruiterName } from "./useRecruiterName";

// One contractor, and everything needed to get through the call without
// leaving the row.
//
// Deliberately a card rather than a table row. The homeowner desk is a table
// because that call is fifteen seconds and the operator wants to see the next
// eight names; this call is two minutes, involves a number to write down and a
// text to send, and the thing that matters is having it all in one place.

export type Prospect = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string | null;
  trade: string | null;
  city: string | null;
  state: string | null;
  approxListSize: number | null;
  notes: string | null;
  disposition: string;
  callCount: number;
  lastCalledLabel: string | null;
  dueLabel: string | null;
};

export default function ProspectCard({
  prospect,
  signupUrl,
}: {
  prospect: Prospect;
  /** Where the link points. Resolved on the server so it is right per deploy. */
  signupUrl: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [size, setSize] = useState(
    prospect.approxListSize != null ? String(prospect.approxListSize) : "",
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [callerName] = useRecruiterName();

  // Composed here rather than on the server so the caller's own name is in it.
  // The functions are pure and the figures inside them come from the domain,
  // so the number in the text can never drift from the number on the page.
  // Matches the script's placeholder, so a text sent before the name is filled
  // in is obviously unfinished rather than quietly odd.
  const who = callerName.trim() || "[your name]";
  const smsBody = followUpText({
    callerName: who,
    businessName: prospect.businessName,
    url: signupUrl,
  });
  const email = followUpEmail({
    callerName: who,
    businessName: prospect.businessName,
    contactName: prospect.contactName,
    url: signupUrl,
  });

  const trade = getProspectTrade(prospect.trade);
  const tel = prospect.phone.replace(/[^\d+]/g, "");
  const smsHref = `sms:${tel}${/iPhone|iPad|Mac/.test(
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  )
    ? "&"
    : "?"}body=${encodeURIComponent(smsBody)}`;

  function press(value: string) {
    setError(null);
    start(async () => {
      const res = await logCall(prospect.id, value, notes || undefined);
      if (!res.ok) setError(res.error);
      else setDone(value);
    });
  }

  function saveSize() {
    if (!size.trim()) return;
    setError(null);
    start(async () => {
      const res = await setListSize(prospect.id, size);
      if (!res.ok) setError(res.error);
    });
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Couldn't copy — select it by hand.");
    }
  }

  const listNumber = Number.parseInt(size, 10);
  const tooSmall = Number.isFinite(listNumber) && listNumber > 0 && listNumber < MIN_VIABLE_LIST;

  return (
    <article
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-opacity ${
        done ? "opacity-40" : ""
      } ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink">{prospect.businessName}</h3>
          <p className="mt-0.5 truncate text-xs text-neutral-400">
            {[
              prospect.contactName || null,
              trade?.label ?? null,
              [prospect.city, prospect.state].filter(Boolean).join(", ") || null,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
        <div className="text-right">
          <a
            href={`tel:${tel}`}
            className="block font-mono text-lg font-bold text-brand-cyan hover:text-ink"
          >
            {prospect.phone}
          </a>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {prospect.callCount > 0 ? `${prospect.callCount}× called` : "never called"}
            {prospect.lastCalledLabel ? ` · ${prospect.lastCalledLabel} ago` : ""}
            {prospect.dueLabel ? ` · due ${prospect.dueLabel}` : ""}
          </p>
        </div>
      </div>

      {/* Why their list is worth calling about, in their own trade's terms.
          It is the opener, and having it on screen means it gets said. */}
      {trade && (
        <p className="mt-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/[0.06] px-3 py-2 text-xs leading-relaxed text-neutral-300">
          {trade.why} <span className="text-neutral-500">Usually {trade.typicalList} customers.</span>
        </p>
      )}

      {prospect.notes && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">{prospect.notes}</p>
      )}

      {/* The one number worth capturing on the call. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={`size-${prospect.id}`} className="text-xs text-neutral-400">
          Past customers:
        </label>
        <input
          id={`size-${prospect.id}`}
          type="number"
          min={0}
          inputMode="numeric"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          onBlur={saveSize}
          placeholder="—"
          className="w-24 rounded border border-white/15 bg-paper/60 px-2 py-1 font-mono text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none"
        />
        {tooSmall && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500/90">
            under {MIN_VIABLE_LIST} — not worth working yet
          </span>
        )}
      </div>

      {/* Send the link while still on the phone. Both rails, because half of
          these people give you a mobile and half give you an office email. */}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={smsHref}
          className="rounded border border-brand-cyan/50 bg-brand-cyan/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-cyan hover:border-brand-cyan"
        >
          Text the link
        </a>
        <button
          type="button"
          onClick={() => copy(smsBody, "sms")}
          className="rounded border border-white/15 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
        >
          {copied === "sms" ? "Copied" : "Copy text"}
        </button>
        {prospect.email && (
          <a
            href={`mailto:${prospect.email}?subject=${encodeURIComponent(
              email.subject,
            )}&body=${encodeURIComponent(email.body)}`}
            className="rounded border border-white/15 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
          >
            Email it
          </a>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="What they said — goes on the call log."
        className="mt-3 w-full rounded-lg border border-white/15 bg-paper/60 px-3 py-2 text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {PROSPECT_ACTIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            disabled={pending}
            onClick={() => press(d.value)}
            title={d.label}
            className={`rounded border px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide disabled:opacity-50 ${
              d.tone === "GOOD"
                ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan hover:border-brand-cyan"
                : d.tone === "BAD"
                  ? "border-white/15 text-neutral-400 hover:border-brand hover:text-brand-light"
                  : "border-white/15 text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
            }`}
          >
            {d.short}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-brand-light">
          {error}
        </p>
      )}
      {done && !error && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
          Logged — {done.replace(/_/g, " ").toLowerCase()}
        </p>
      )}
    </article>
  );
}
