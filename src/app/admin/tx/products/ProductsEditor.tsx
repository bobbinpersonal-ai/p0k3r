"use client";

import { useState } from "react";
import { TRADES, UNITS, type Tier } from "@/lib/texas/trades";
import { marginAtBase, type ProductConfigInput } from "@/lib/texas/productCatalogue";

// Where a supplier agreement becomes something a rep can sell.
//
// The margin at base is shown live beside every product, because that is the
// number the whole comp structure sits on: a rep keeps 60% of what they sell
// above base, so base is the floor the company is building on and a thin one
// is a decision rather than an accident.

type Editable = ProductConfigInput & { edited: boolean; seeded: boolean };

const FIELD =
  "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-ink placeholder:text-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-neutral-400";
const TIERS: Tier[] = ["GOOD", "BETTER", "BEST"];

function blank(trade: string): Editable {
  return {
    trade,
    value: "",
    label: "",
    description: "",
    brand: null,
    line: null,
    tier: "BETTER",
    warranty: null,
    sellingPoints: [],
    costPerUnit: 0,
    basePerUnit: 0,
    active: true,
    sortOrder: 100,
    edited: false,
    seeded: false,
  };
}


/**
 * The editing panel.
 *
 * Extracted because it is needed in two places and only ever rendered in one:
 * clicking "Add a product" set a draft with no row to hang it on, so the
 * button appeared to do nothing at all.
 */
function ProductForm({
  draft,
  unit,
  errors,
  saving,
  canRevert,
  revertLabel,
  patch,
  save,
  close,
  revert,
}: {
  draft: Editable;
  unit: { short: string; hint: string; label: string };
  errors: string[];
  saving: boolean;
  canRevert: boolean;
  revertLabel: string;
  patch: (next: Partial<Editable>) => void;
  save: () => void;
  close: () => void;
  revert: () => void;
}) {
  return (
    <div className="border-t border-white/10 px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className={LABEL} htmlFor="p-brand">Brand</label>
                      <input
                        id="p-brand"
                        value={draft.brand ?? ""}
                        placeholder="Owens Corning"
                        onChange={(e) => patch({ brand: e.target.value || null })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="p-line">Product line</label>
                      <input
                        id="p-line"
                        value={draft.line ?? ""}
                        placeholder="TruDefinition Duration"
                        onChange={(e) => patch({ line: e.target.value || null })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="p-tier">Tier</label>
                      <select
                        id="p-tier"
                        value={draft.tier}
                        onChange={(e) => patch({ tier: e.target.value as Tier })}
                        className={`mt-1 ${FIELD}`}
                      >
                        {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className={LABEL} htmlFor="p-label">Name, as the rep says it</label>
                    <input
                      id="p-label"
                      value={draft.label}
                      onChange={(e) => patch({ label: e.target.value })}
                      className={`mt-1 ${FIELD}`}
                    />
                  </div>
                  <div className="mt-3">
                    <label className={LABEL} htmlFor="p-desc">One line about it</label>
                    <input
                      id="p-desc"
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      className={`mt-1 ${FIELD}`}
                    />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={LABEL} htmlFor="p-cost">
                        Our cost per {unit.short}
                      </label>
                      <input
                        id="p-cost"
                        type="number"
                        step="0.01"
                        value={draft.costPerUnit}
                        onChange={(e) => patch({ costPerUnit: Number(e.target.value) })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="p-base">
                        Base price per {unit.short}
                      </label>
                      <input
                        id="p-base"
                        type="number"
                        step="0.01"
                        value={draft.basePerUnit}
                        onChange={(e) => patch({ basePerUnit: Number(e.target.value) })}
                        className={`mt-1 ${FIELD}`}
                      />
                    </div>
                  </div>
                  <p
                    data-margin
                    className={`mt-2 font-mono text-xs ${
                      draft.basePerUnit <= draft.costPerUnit ? "text-brand-light" : "text-neutral-300"
                    }`}
                  >
                    {draft.basePerUnit <= draft.costPerUnit
                      ? `Base is not above cost — every one sold at base loses $${(draft.costPerUnit - draft.basePerUnit).toFixed(2)} per ${unit.short}.`
                      : `${Math.round(marginAtBase(draft) * 100)}% margin at base. Everything a rep sells above this, they keep 60% of.`}
                  </p>

                  <div className="mt-3">
                    <label className={LABEL} htmlFor="p-warranty">
                      Warranty <span className="normal-case text-neutral-500">— copy it verbatim from the dealer materials</span>
                    </label>
                    <input
                      id="p-warranty"
                      value={draft.warranty ?? ""}
                      placeholder="Leave blank until you have the exact wording"
                      onChange={(e) => patch({ warranty: e.target.value || null })}
                      className={`mt-1 ${FIELD}`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className={LABEL} htmlFor="p-points">
                      What the rep says — one per line
                    </label>
                    <textarea
                      id="p-points"
                      rows={4}
                      value={draft.sellingPoints.join("\n")}
                      onChange={(e) => patch({ sellingPoints: e.target.value.split("\n") })}
                      className={`mt-1 ${FIELD}`}
                    />
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm text-neutral-200">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(e) => patch({ active: e.target.checked })}
                    />
                    Sellable right now
                  </label>

                  {errors.length > 0 && (
                    <ul role="alert" className="mt-4 space-y-1 rounded-xl border border-brand/50 bg-brand/10 p-3 text-sm text-ink">
                      {errors.map((m) => <li key={m}>{m}</li>)}
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
                    {canRevert && (
                      <button
                        type="button"
                        onClick={revert}
                        className="ml-auto rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-neutral-300"
                      >
                        {revertLabel}
                      </button>
                    )}
                  </div>
                </div>
  );
}

export default function ProductsEditor({ initial }: { initial: Editable[] }) {
  const [products, setProducts] = useState(initial);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const keyOf = (p: { trade: string; value: string }) => `${p.trade}:${p.value}`;

  function open(product: Editable, key: string) {
    setOpenKey(key);
    setDraft(JSON.parse(JSON.stringify(product)));
    setErrors([]);
    setNote(null);
  }
  const close = () => { setOpenKey(null); setDraft(null); setErrors([]); };
  const patch = (next: Partial<Editable>) => setDraft((d) => (d ? { ...d, ...next } : d));

  async function refresh() {
    const res = await fetch("/api/admin/tx/products");
    if (res.ok) setProducts((await res.json()).products);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch("/api/admin/tx/products", {
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
      setNote(`Saved. ${draft.label} is priced and sellable.`);
      close();
    } finally {
      setSaving(false);
    }
  }

  async function revert(product: Editable) {
    const question = product.seeded
      ? `Put ${product.label} back to the rates this repo shipped with?`
      : `Delete ${product.label}? Estimates already signed keep their own copy of the price.`;
    if (!window.confirm(question)) return;
    await fetch(
      `/api/admin/tx/products?trade=${encodeURIComponent(product.trade)}&value=${encodeURIComponent(product.value)}`,
      { method: "DELETE" },
    );
    await refresh();
    setNote(product.seeded ? `${product.label} is back to seed pricing.` : `${product.label} removed.`);
    close();
  }

  return (
    <div className="mt-8">
      {note && (
        <p className="mb-4 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-ink">
          {note}
        </p>
      )}

      {TRADES.map((trade) => {
        const mine = products.filter((p) => p.trade === trade.value);
        const unit = UNITS[trade.unit];
        return (
          <section key={trade.value} className="mb-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">{trade.label}</h2>
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                priced per {unit.short} · {unit.hint}
              </p>
            </div>

            {/* Where the trade stops. On garage doors this is the licensing
                line, not a caveat, so whoever prices the work sees it. */}
            {trade.excludes.length > 0 && (
              <ul className="mt-2 space-y-0.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                {trade.excludes.map((item) => (
                  <li key={item} className="text-xs text-neutral-400">
                    · {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 space-y-2">
              {mine.map((product) => {
                const key = keyOf(product);
                const isOpen = openKey === key && draft !== null;
                const margin = marginAtBase(product);
                return (
                  <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => (isOpen ? close() : open(product, key))}
                      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">
                          {product.label}
                          <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase text-neutral-400">
                            {product.tier}
                          </span>
                          {!product.edited && (
                            <span
                              title="These rates are placeholders this repo shipped with — open it and put your real numbers in."
                              className="ml-2 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase text-brand-cyan"
                            >
                              Seed pricing
                            </span>
                          )}
                          {!product.active && (
                            <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 font-mono text-[10px] uppercase text-neutral-400">
                              Off
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-neutral-400">
                          {product.brand ? `${product.brand} · ` : ""}
                          {product.description}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-right font-mono text-sm">
                        <span className="block text-brand-cyan">
                          ${product.basePerUnit}/{unit.short}
                        </span>
                        <span className="block text-[11px] text-neutral-400">
                          cost ${product.costPerUnit} · {Math.round(margin * 100)}% margin
                        </span>
                      </span>
                    </button>

                    {isOpen && draft && (
                      <ProductForm
                        draft={draft}
                        unit={unit}
                        errors={errors}
                        saving={saving}
                        canRevert={product.edited}
                        revertLabel={product.seeded ? "Back to seed pricing" : "Delete product"}
                        patch={patch}
                        save={save}
                        close={close}
                        revert={() => revert(product)}
                      />
                    )}
                  </div>
                );
              })}

              {openKey === `new:${trade.value}` && draft ? (
                <div className="rounded-2xl border border-brand/40 bg-brand/5">
                  <p className="px-4 pt-4 font-semibold text-ink">
                    New {trade.label.toLowerCase()} product
                  </p>
                  <ProductForm
                    draft={draft}
                    unit={unit}
                    errors={errors}
                    saving={saving}
                    canRevert={false}
                    revertLabel=""
                    patch={patch}
                    save={save}
                    close={close}
                    revert={close}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => open(blank(trade.value), `new:${trade.value}`)}
                  className="w-full rounded-2xl border border-dashed border-white/20 px-4 py-3 text-sm font-semibold text-neutral-300 hover:border-brand hover:text-brand-cyan"
                >
                  + Add a {trade.label.toLowerCase()} product
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
