"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// The kitchen-table estimator.
//
// Measure, pick the product, see the floor, set the price, take the deposit on
// one of our rails, get it signed. Prices are recomputed here as the crew types
// so the conversation can move, and recomputed again on the server before
// anything is written — this component is for showing a number, never for
// deciding one.

type Option = {
  value: string;
  label: string;
  tier: string;
  brand: string | null;
  description: string;
  costPerUnit: number;
  basePerUnit: number;
  sellingPoints: string[];
};
type Trade = {
  value: string;
  label: string;
  unit: string;
  minimumUnits: number;
  implausibleAbove: number;
  excludes: string[];
  options: Option[];
};
type Rail = { value: string; label: string; note: string };

const UNIT_LABEL: Record<string, string> = {
  SQUARE: "squares",
  LINEAR_FOOT: "linear feet",
  OPENING: "openings",
};

const FIELD =
  "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-base text-ink placeholder:text-neutral-500 focus:border-[color:var(--rc)] focus:outline-none";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default function Estimator({
  leadId,
  customerName,
  trades,
  rails,
  w9OnFile,
}: {
  leadId: string;
  customerName: string;
  trades: Trade[];
  rails: Rail[];
  w9OnFile: boolean;
}) {
  const router = useRouter();
  const [tradeValue, setTradeValue] = useState(trades[0]?.value ?? "");
  const [optionValue, setOptionValue] = useState(trades[0]?.options[0]?.value ?? "");
  const [quantity, setQuantity] = useState("");
  const [sold, setSold] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [signerName, setSignerName] = useState(customerName);
  const [scopeNotes, setScopeNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ sold: number; commission: number } | null>(null);

  const trade = useMemo(() => trades.find((t) => t.value === tradeValue), [trades, tradeValue]);
  const option = useMemo(
    () => trade?.options.find((o) => o.value === optionValue),
    [trade, optionValue],
  );

  const qty = Number(quantity);
  const validQty = Number.isFinite(qty) && qty > 0;

  // The same minimum the server applies: below it a crew and a truck cost the
  // same, so the job is priced at the minimum rather than at what was measured.
  const billable = trade && validQty ? Math.max(qty, trade.minimumUnits) : 0;
  const base = option ? Math.round(billable * option.basePerUnit) : 0;
  const cost = option ? Math.round(billable * option.costPerUnit) : 0;

  const soldNum = Number(sold);
  const validSold = Number.isFinite(soldNum) && soldNum >= base && base > 0;
  const overage = validSold ? soldNum - base : 0;
  // Shown, not calculated as truth — the server recomputes it on the contractor's
  // own terms before anything is written.
  const yours = Math.round(overage * 0.3);
  const implausible = trade && validQty && qty > trade.implausibleAbove;

  function pickTrade(value: string) {
    setTradeValue(value);
    const next = trades.find((t) => t.value === value);
    setOptionValue(next?.options[0]?.value ?? "");
    setSold("");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/crew/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          lines: [{ trade: tradeValue, option: optionValue, quantity: qty }],
          soldPrice: soldNum,
          signerName,
          scopeNotes,
          depositAmount: depositAmount ? Number(depositAmount) : 0,
          depositMethod: depositMethod || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't write that up.");
      setDone({ sold: body.sold, commission: body.yourCommission });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't write that up.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rc-border rc-fill mt-6 rounded-2xl border p-5">
        <p className="rc-accent font-mono text-xs uppercase tracking-[0.2em]">Signed</p>
        <p className="mt-2 font-mono text-3xl font-bold text-ink tabular-nums">
          {money(done.sold)}
        </p>
        <p className="rc-accent mt-1 font-mono text-sm tabular-nums">
          +{money(done.commission)} to you on top of the work
        </p>
        <p className="mt-3 text-sm leading-relaxed text-neutral-300">
          The office has it. Anything the homeowner still owes gets collected on our system — if
          they try to hand you money, tell the office the same day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6">
      {/* ---- what it is ---- */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
          What are you doing
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {trades.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => pickTrade(t.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                t.value === tradeValue
                  ? "rc-border rc-fill rc-accent"
                  : "border-white/12 text-neutral-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {trade && trade.excludes.length > 0 && (
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Not included: {trade.excludes.join(", ")}.
          </p>
        )}
      </section>

      {/* ---- how much ---- */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
          How much of it
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <input
            inputMode="decimal"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            aria-label={`Quantity in ${trade ? UNIT_LABEL[trade.unit] : "units"}`}
            className={`${FIELD} font-mono text-2xl tabular-nums`}
          />
          <span className="shrink-0 font-mono text-sm text-neutral-400">
            {trade ? UNIT_LABEL[trade.unit] : ""}
          </span>
        </div>
        {trade && validQty && qty < trade.minimumUnits && (
          <p className="mt-2 text-xs text-neutral-400">
            Priced at the {trade.minimumUnits}-{UNIT_LABEL[trade.unit].replace(/s$/, "")} minimum —
            the truck costs the same either way.
          </p>
        )}
        {implausible && (
          <p className="mt-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs text-ink">
            That is a big number. Worth measuring twice before you present it.
          </p>
        )}
      </section>

      {/* ---- which product ---- */}
      {trade && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Which one you&apos;re selling
          </h2>
          <div className="mt-3 space-y-2">
            {trade.options.map((o) => {
              const picked = o.value === optionValue;
              const lineBase = validQty ? Math.round(billable * o.basePerUnit) : 0;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setOptionValue(o.value);
                    setSold("");
                  }}
                  className={`w-full rounded-xl border p-4 text-left ${
                    picked ? "rc-border rc-fill" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-bold text-ink">{o.label}</span>
                    {validQty && (
                      <span
                        className={`shrink-0 font-mono text-sm tabular-nums ${
                          picked ? "rc-accent" : "text-neutral-400"
                        }`}
                      >
                        from {money(lineBase)}
                      </span>
                    )}
                  </div>
                  {o.brand && (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                      {o.brand} · {o.tier}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{o.description}</p>
                  {picked && o.sellingPoints.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {o.sellingPoints.map((s) => (
                        <li key={s} className="flex gap-2 text-sm text-neutral-300">
                          <span className="rc-accent shrink-0 font-mono text-xs">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---- the price ---- */}
      {base > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            The price
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-neutral-500">Our cost</dt>
              <dd className="font-mono text-lg text-neutral-300 tabular-nums">{money(cost)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Floor — never below</dt>
              <dd className="rc-accent font-mono text-lg font-bold tabular-nums">{money(base)}</dd>
            </div>
          </dl>

          <label htmlFor="sold" className="mt-4 block text-sm font-semibold text-ink">
            What you sold it for
          </label>
          <input
            id="sold"
            inputMode="decimal"
            required
            value={sold}
            onChange={(e) => setSold(e.target.value)}
            placeholder={String(base)}
            className={`${FIELD} mt-2 font-mono text-2xl tabular-nums`}
          />
          {sold && !validSold && (
            <p className="mt-2 text-sm text-brand-light">
              The floor is {money(base)}. You can sell above it, never below.
            </p>
          )}
          {validSold && overage > 0 && (
            <p className="rc-accent mt-2 font-mono text-sm tabular-nums">
              {money(overage)} over the floor · {money(yours)} of that is yours
            </p>
          )}
        </section>
      )}

      {/* ---- the money ---- */}
      {validSold && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Deposit
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Taken on our system, always. Never cash, a cheque made out to you, or a transfer to
            your own account — that is the one thing that ends the agreement.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              inputMode="decimal"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount (optional)"
              aria-label="Deposit amount"
              className={`${FIELD} font-mono tabular-nums`}
            />
            <select
              value={depositMethod}
              onChange={(e) => setDepositMethod(e.target.value)}
              aria-label="How it was paid"
              className={`${FIELD} [color-scheme:dark]`}
            >
              <option value="">How it was paid</option>
              {rails.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {depositAmount && !depositMethod && (
            <p className="mt-2 text-sm text-brand-light">
              Say which of our methods took it.
            </p>
          )}
        </section>
      )}

      {/* ---- sign ---- */}
      {validSold && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            Who signed it
          </h2>
          <input
            required
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Homeowner's name as they sign it"
            aria-label="Signer name"
            className={`${FIELD} mt-3`}
          />
          <textarea
            rows={2}
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            placeholder="Anything about the job the office should know (optional)"
            aria-label="Scope notes"
            className={`${FIELD} mt-3`}
          />
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !validSold || !w9OnFile}
        className="rc-glow w-full rounded-xl bg-[#3DE0C0] px-6 py-4 text-base font-bold text-[#08201B] disabled:opacity-50"
      >
        {busy ? "Writing it up…" : validSold ? `Write it up at ${money(soldNum)}` : "Write it up"}
      </button>
      {!w9OnFile && (
        <p className="text-center text-xs text-neutral-500">
          Needs your W-9 on file first.
        </p>
      )}
    </form>
  );
}
