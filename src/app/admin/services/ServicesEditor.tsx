"use client";

import { useState } from "react";
import {
  EXEMPTION_LIMIT,
  LANDSCAPING_CONSTANTS,
  YARD_SIZES,
  type CostRow,
  type YardSizeValue,
} from "@/lib/landscaping";
import { minimumPriceFor, type ServiceConfigInput } from "@/lib/serviceCatalogue";

// The screen where prices change.
//
// It shows its working. Every size row displays what the crew clears per
// person-hour at that price, live, next to the floor it has to beat — because
// the alternative is typing a number, saving, and being told no by a server
// that knew the answer all along. The same two rules are enforced again on
// write (src/lib/serviceCatalogue.ts); this is the version you can argue with
// before you commit to it.

type Editable = ServiceConfigInput & { edited: boolean; builtIn: boolean };

const { CREW_FLOOR_HOURLY, PLATFORM_RATE } = LANDSCAPING_CONSTANTS;

const FIELD =
  "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-ink placeholder:text-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-neutral-400";

/** What the crew actually clears per person-hour at a given price. */
function crewRate(price: number, cost: CostRow): number {
  const payout = Math.ceil(price * (1 - PLATFORM_RATE));
  return (payout - cost.supplies) / cost.hours.high;
}

function blankService(): Editable {
  const sizes = {} as Record<YardSizeValue, number>;
  const cost = {} as Record<YardSizeValue, CostRow>;
  YARD_SIZES.forEach((size, i) => {
    cost[size.value] = { hours: { low: 2 + i, high: 3 + i * 1.5 }, crewSize: 2, supplies: 25 };
    // Seeded just above the floor rather than at zero, so a new service opens
    // in a state that would actually save.
    sizes[size.value] = minimumPriceFor(cost[size.value]) + 20;
  });
  return {
    value: "",
    label: "",
    shortLabel: "",
    description: "",
    includes: [],
    excludes: [],
    allowsRecurring: false,
    materialsNote: null,
    active: true,
    sortOrder: 100,
    prices: sizes,
    cost,
    edited: false,
    builtIn: false,
  };
}

export default function ServicesEditor({ initial }: { initial: Editable[] }) {
  const [services, setServices] = useState<Editable[]>(initial);
  const [openValue, setOpenValue] = useState<string | null>(null);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function open(service: Editable) {
    setOpenValue(service.value || "__new__");
    setDraft(JSON.parse(JSON.stringify(service)));
    setErrors([]);
    setNote(null);
  }

  function close() {
    setOpenValue(null);
    setDraft(null);
    setErrors([]);
  }

  function patch(next: Partial<Editable>) {
    setDraft((prev) => (prev ? { ...prev, ...next } : prev));
  }

  function patchSize(size: YardSizeValue, price: number | null, cost: Partial<CostRow> | null) {
    setDraft((prev) => {
      if (!prev) return prev;
      const prices = { ...prev.prices };
      const costs = { ...prev.cost };
      if (price !== null) prices[size] = price;
      if (cost) {
        costs[size] = {
          hours: { ...costs[size].hours, ...(cost.hours ?? {}) },
          crewSize: cost.crewSize ?? costs[size].crewSize,
          supplies: cost.supplies ?? costs[size].supplies,
        };
      }
      return { ...prev, prices, cost: costs };
    });
  }

  async function refresh() {
    const res = await fetch("/api/admin/services");
    if (res.ok) setServices((await res.json()).services);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors(body?.errors ?? [body?.error ?? "Could not save."]);
        return;
      }
      await refresh();
      setNote(`Saved. ${draft.label} is live on the site now.`);
      close();
    } finally {
      setSaving(false);
    }
  }

  async function revert(service: Editable) {
    const question = service.builtIn
      ? `Put ${service.label} back to its standard prices and wording?`
      : `Delete ${service.label} completely? Bookings already taken keep their own record.`;
    if (!window.confirm(question)) return;
    await fetch(`/api/admin/services?value=${encodeURIComponent(service.value)}`, {
      method: "DELETE",
    });
    await refresh();
    setNote(service.builtIn ? `${service.label} is back to standard.` : `${service.label} removed.`);
    close();
  }

  return (
    <div className="mt-8">
      {note && (
        <p className="mb-4 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-ink">
          {note}
        </p>
      )}

      <div className="space-y-3">
        {services.map((service) => {
          const isOpen = openValue === service.value && draft !== null;
          return (
            <div
              key={service.value}
              className="rounded-2xl border border-white/10 bg-white/[0.04]"
            >
              <button
                type="button"
                onClick={() => (isOpen ? close() : open(service))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">
                    {service.label}
                    {!service.active && (
                      <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase text-neutral-400">
                        Off
                      </span>
                    )}
                    {service.edited && (
                      <span className="ml-2 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase text-brand-cyan">
                        {service.builtIn ? "Edited" : "Custom"}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-neutral-400">
                    {service.description}
                  </span>
                </span>
                <span className="font-mono text-sm text-brand-cyan">
                  {YARD_SIZES.map((size) => `$${service.prices[size.value]}`).join(" · ")}
                </span>
              </button>

              {isOpen && draft && (
                <div className="border-t border-white/10 px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={LABEL} htmlFor="svc-label">
                        Name
                      </label>
                      <input
                        id="svc-label"
                        value={draft.label}
                        onChange={(e) => patch({ label: e.target.value })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="svc-short">
                        Short name <span className="normal-case text-neutral-500">(for cards)</span>
                      </label>
                      <input
                        id="svc-short"
                        value={draft.shortLabel}
                        onChange={(e) => patch({ shortLabel: e.target.value })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className={LABEL} htmlFor="svc-desc">
                      One line, on the card
                    </label>
                    <input
                      id="svc-desc"
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      className={`mt-1 ${FIELD}`}
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={LABEL} htmlFor="svc-inc">
                        What&apos;s included — one per line
                      </label>
                      <textarea
                        id="svc-inc"
                        rows={4}
                        value={draft.includes.join("\n")}
                        onChange={(e) => patch({ includes: e.target.value.split("\n") })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="svc-exc">
                        What&apos;s not — one per line
                      </label>
                      <textarea
                        id="svc-exc"
                        rows={4}
                        value={draft.excludes.join("\n")}
                        onChange={(e) => patch({ excludes: e.target.value.split("\n") })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                  </div>

                  {/* Prices, with the wage arithmetic shown next to each one. */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-separate border-spacing-y-1 text-sm">
                      <thead>
                        <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                          <th className="pr-2">Size</th>
                          <th className="pr-2">Price</th>
                          <th className="pr-2">Hours (low–high)</th>
                          <th className="pr-2">Crew</th>
                          <th className="pr-2">Supplies</th>
                          <th>Crew clears</th>
                        </tr>
                      </thead>
                      <tbody>
                        {YARD_SIZES.map((size) => {
                          const cost = draft.cost[size.value];
                          const price = draft.prices[size.value];
                          const rate = crewRate(price, cost);
                          const floor = minimumPriceFor(cost);
                          const tooLow = price < floor;
                          const tooHigh = price >= EXEMPTION_LIMIT;
                          return (
                            <tr key={size.value}>
                              <td className="pr-2 font-semibold text-ink">{size.label}</td>
                              <td className="pr-2">
                                <input
                                  type="number"
                                  aria-label={`${size.label} price`}
                                  value={price}
                                  onChange={(e) =>
                                    patchSize(size.value, Number(e.target.value), null)
                                  }
                                  className={`w-24 ${FIELD} ${
                                    tooLow || tooHigh ? "border-brand" : ""
                                  }`}
                                />
                              </td>
                              <td className="flex gap-1 pr-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  aria-label={`${size.label} hours low`}
                                  value={cost.hours.low}
                                  onChange={(e) =>
                                    patchSize(size.value, null, {
                                      hours: { low: Number(e.target.value), high: cost.hours.high },
                                    })
                                  }
                                  className={`w-16 ${FIELD}`}
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  aria-label={`${size.label} hours high`}
                                  value={cost.hours.high}
                                  onChange={(e) =>
                                    patchSize(size.value, null, {
                                      hours: { low: cost.hours.low, high: Number(e.target.value) },
                                    })
                                  }
                                  className={`w-16 ${FIELD}`}
                                />
                              </td>
                              <td className="pr-2">
                                <input
                                  type="number"
                                  aria-label={`${size.label} crew size`}
                                  value={cost.crewSize}
                                  onChange={(e) =>
                                    patchSize(size.value, null, { crewSize: Number(e.target.value) })
                                  }
                                  className={`w-14 ${FIELD}`}
                                />
                              </td>
                              <td className="pr-2">
                                <input
                                  type="number"
                                  aria-label={`${size.label} supplies`}
                                  value={cost.supplies}
                                  onChange={(e) =>
                                    patchSize(size.value, null, { supplies: Number(e.target.value) })
                                  }
                                  className={`w-20 ${FIELD}`}
                                />
                              </td>
                              <td
                                data-rate={size.value}
                                className={`font-mono text-xs ${
                                  tooLow || tooHigh ? "text-brand-light" : "text-neutral-300"
                                }`}
                              >
                                ${rate.toFixed(0)}/hr
                                {tooLow && ` · needs $${floor}`}
                                {tooHigh && ` · over the $${EXEMPTION_LIMIT} limit`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="mt-1 text-xs text-neutral-400">
                      Crew clears is per person-hour at the slow end, after supplies and our{" "}
                      {Math.round(PLATFORM_RATE * 100)}% — it has to stay at or above $
                      {CREW_FLOOR_HOURLY}, which is what /drive advertises. Nothing may reach $
                      {EXEMPTION_LIMIT.toLocaleString()}, which is the most we may sell unlicensed.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-neutral-200">
                      <input
                        type="checkbox"
                        checked={draft.allowsRecurring}
                        onChange={(e) => patch({ allowsRecurring: e.target.checked })}
                      />
                      Can be booked on a schedule
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-200">
                      <input
                        type="checkbox"
                        checked={draft.active}
                        onChange={(e) => patch({ active: e.target.checked })}
                      />
                      Offered right now
                    </label>
                    <label className="flex flex-1 items-center gap-2 text-sm text-neutral-200">
                      <span className="whitespace-nowrap">Materials note</span>
                      <input
                        value={draft.materialsNote ?? ""}
                        placeholder="e.g. Labour only — materials at cost"
                        onChange={(e) => patch({ materialsNote: e.target.value || null })}
                        className={FIELD}
                      />
                    </label>
                  </div>

                  {errors.length > 0 && (
                    <ul role="alert" className="mt-4 space-y-1 rounded-xl border border-brand/50 bg-brand/10 p-3 text-sm text-ink">
                      {errors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save and go live"}
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-neutral-200"
                    >
                      Cancel
                    </button>
                    {service.edited && (
                      <button
                        type="button"
                        onClick={() => revert(service)}
                        className="ml-auto rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-neutral-300"
                      >
                        {service.builtIn ? "Back to standard" : "Delete service"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openValue === "__new__" && draft ? null : (
        <button
          type="button"
          onClick={() => open(blankService())}
          className="mt-4 w-full rounded-2xl border border-dashed border-white/20 px-4 py-4 text-sm font-semibold text-neutral-300 hover:border-brand hover:text-brand-cyan"
        >
          + Add a service
        </button>
      )}

      {openValue === "__new__" && draft && (
        <div className="mt-4 rounded-2xl border border-brand/40 bg-brand/5 p-4">
          <p className="font-semibold text-ink">New service</p>
          <p className="mt-1 text-xs text-neutral-300">
            Name it, price it, and it appears on the homepage, the booking flow, the door form
            and the printed sheet. Give it a name you&apos;d say out loud on a doorstep.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={draft.label}
              onChange={(e) => patch({ label: e.target.value, shortLabel: e.target.value })}
              placeholder="Name, e.g. Gutter Clearing"
              aria-label="New service name"
              className={FIELD}
            />
            <input
              value={draft.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="One line about it"
              aria-label="New service description"
              className={FIELD}
            />
          </div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {YARD_SIZES.map((size) => {
                const cost = draft.cost[size.value];
                const price = draft.prices[size.value];
                const floor = minimumPriceFor(cost);
                return (
                  <tr key={size.value}>
                    <td className="py-1 pr-3 font-semibold text-ink">{size.label}</td>
                    <td className="py-1 pr-3">
                      <input
                        type="number"
                        aria-label={`New ${size.label} price`}
                        value={price}
                        onChange={(e) => patchSize(size.value, Number(e.target.value), null)}
                        className={`w-24 ${FIELD}`}
                      />
                    </td>
                    <td className="py-1 font-mono text-xs text-neutral-400">
                      ${crewRate(price, cost).toFixed(0)}/hr to the crew · min ${floor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {errors.length > 0 && (
            <ul role="alert" className="mt-3 space-y-1 rounded-xl border border-brand/50 bg-brand/10 p-3 text-sm text-ink">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add it"}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-neutral-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
