"use client";

import { useState } from "react";
import { NO_SALE_REASONS } from "@/lib/regions/noSale";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

// Filed from a kitchen table on a phone, usually within a minute of walking
// out. Everything about it is built for that: big targets, the reason picked
// before anything is typed, and the guidance for the chosen reason shown
// inline so codes stay used the same way by everybody.

export type NoSaleLead = {
  id: string;
  customerName: string;
  address: string;
  partnerName: string | null;
  existing: {
    reason: string;
    detail: string;
    filedBy: string;
    quotedAmount: number | null;
    customerAcknowledged: boolean;
    revisitAt: string | null;
  } | null;
};

export default function NoSaleForm({ leads }: { leads: readonly NoSaleLead[] }) {
  const [leadId, setLeadId] = useState("");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [filedBy, setFiledBy] = useState("");
  const [quotedAmount, setQuotedAmount] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [revisitAt, setRevisitAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const lead = leads.find((l) => l.id === leadId);
  const picked = NO_SALE_REASONS.find((r) => r.value === reason);

  function choose(id: string) {
    setLeadId(id);
    setSaved(false);
    setError(null);
    const next = leads.find((l) => l.id === id);
    // Editing an existing note rather than starting blank, so a rep correcting
    // a typo doesn't silently wipe what they wrote last week.
    setReason(next?.existing?.reason ?? "");
    setDetail(next?.existing?.detail ?? "");
    setFiledBy(next?.existing?.filedBy ?? filedBy);
    setQuotedAmount(next?.existing?.quotedAmount?.toString() ?? "");
    setAcknowledged(next?.existing?.customerAcknowledged ?? false);
    setRevisitAt(next?.existing?.revisitAt?.slice(0, 10) ?? "");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/no-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          reason,
          detail,
          filedBy,
          quotedAmount: quotedAmount ? Number(quotedAmount) : null,
          customerAcknowledged: acknowledged,
          revisitAt: revisitAt || null,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Something went wrong.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Appointments run
        </h2>
        {leads.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-300">
            No appointments have been run yet. They show up here once a lead reaches
            &ldquo;appointment booked&rdquo;.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {leads.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => choose(l.id)}
                  aria-pressed={l.id === leadId}
                  className={`w-full rounded-xl border p-3 text-left ${
                    l.id === leadId
                      ? "border-brand-cyan bg-brand-cyan/10"
                      : "border-white/10 bg-white/[0.04] hover:border-white/25"
                  }`}
                >
                  <p className="font-semibold text-ink">{l.customerName}</p>
                  <p className="text-xs text-neutral-400">{l.address}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {l.partnerName ? `via ${l.partnerName}` : "direct"}
                    {l.existing ? " · note filed" : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lead ? (
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-extrabold text-ink">
            {lead.existing ? "Update the note" : "Why it didn't close"}
          </h2>
          <p className="mt-1 text-sm text-neutral-300">
            {lead.customerName}
            {lead.partnerName ? ` · ${lead.partnerName} will read this` : ""}
          </p>

          <div className="mt-4 space-y-3">
            <select
              id="ns-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={FIELD}
            >
              <option value="">Pick a reason</option>
              {NO_SALE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {picked && (
              <p className="rounded-xl border border-white/10 bg-paper/40 p-3 text-xs leading-relaxed text-neutral-300">
                {picked.guidance}
              </p>
            )}

            <textarea
              id="ns-detail"
              required
              rows={4}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="What actually happened, in a couple of sentences. The partner reads this verbatim."
              className={FIELD}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                id="ns-quoted"
                type="number"
                min={0}
                inputMode="numeric"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
                placeholder="What we quoted ($)"
                className={FIELD}
              />
              <input
                id="ns-filedby"
                required
                value={filedBy}
                onChange={(e) => setFiledBy(e.target.value)}
                placeholder="Your name"
                className={FIELD}
              />
            </div>

            {picked?.revisitable && (
              <div>
                <label
                  htmlFor="ns-revisit"
                  className="font-mono text-xs uppercase tracking-widest text-neutral-400"
                >
                  Worth another go after
                </label>
                <input
                  id="ns-revisit"
                  type="date"
                  value={revisitAt}
                  onChange={(e) => setRevisitAt(e.target.value)}
                  className={`${FIELD} mt-1`}
                />
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span>The homeowner confirmed the visit and this outcome at the door</span>
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
          {saved && (
            <p className="mt-3 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-2 text-sm text-ink">
              Filed. It&apos;s on the partner&apos;s page now.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Filing…" : lead.existing ? "Update the note" : "File it"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-sm text-neutral-300">
            Pick the appointment on the left and write what happened.
          </p>
        </div>
      )}
    </div>
  );
}
