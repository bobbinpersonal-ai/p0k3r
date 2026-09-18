"use client";

import { useState, useTransition } from "react";
import { PROSPECT_TRADES } from "@/lib/regions/partnerProspects";
import { addProspect, addProspectsBulk } from "./actions";

// Getting names into the queue.
//
// Two modes because there are two real moments. One at a time is what happens
// mid-call when somebody says "you should talk to my brother-in-law". The
// paste box is what happens on a Sunday night with a Google Maps search open
// and forty shops to get through, and it is the one that decides whether this
// hub gets used at all: a tool you have to type into forty times is a tool you
// abandon on the eleventh.

export default function AddProspects({ states }: { states: readonly { code: string; name: string }[] }) {
  const [mode, setMode] = useState<"one" | "bulk">("bulk");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);

  const [trade, setTrade] = useState("");
  const [state, setState] = useState(states[0]?.code ?? "");
  const [paste, setPaste] = useState("");

  const [one, setOne] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    approxListSize: "",
    notes: "",
  });

  function submitOne(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    start(async () => {
      const res = await addProspect({ ...one, trade, state });
      if (!res.ok) setError(res.error);
      else {
        setMessage(`Added ${one.businessName}.`);
        setOne({
          businessName: "",
          contactName: "",
          phone: "",
          email: "",
          city: "",
          approxListSize: "",
          notes: "",
        });
      }
    });
  }

  function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setReasons([]);
    start(async () => {
      const res = await addProspectsBulk(paste, { trade, state });
      if (!res.ok) setError(res.error);
      else {
        setMessage(
          `Added ${res.added}${res.skipped ? `, skipped ${res.skipped}` : ""}.`,
        );
        setReasons(res.reasons);
        if (res.added > 0) setPaste("");
      }
    });
  }

  const field =
    "w-full rounded-lg border border-white/15 bg-paper/60 px-3 py-2 text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none";
  const label = "block font-mono text-[10px] uppercase tracking-widest text-neutral-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Add contractors to call</h2>
        <div className="flex gap-1">
          {(["bulk", "one"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
                mode === m
                  ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                  : "border-white/15 text-neutral-400 hover:text-ink"
              }`}
            >
              {m === "bulk" ? "Paste a list" : "One at a time"}
            </button>
          ))}
        </div>
      </div>

      {/* Applied to every row in the batch, because a paste is nearly always
          one search: "hvac denver". Asking per row would defeat the point. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="add-trade" className={label}>
            Their trade
          </label>
          <select
            id="add-trade"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className={`${field} mt-1 [color-scheme:dark]`}
          >
            <option value="">Not sure yet</option>
            {PROSPECT_TRADES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="add-state" className={label}>
            State
          </label>
          <select
            id="add-state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={`${field} mt-1 [color-scheme:dark]`}
          >
            {states.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "bulk" ? (
        <form onSubmit={submitBulk} className="mt-4">
          <label htmlFor="add-paste" className={label}>
            One per line — business, phone, contact, city
          </label>
          <textarea
            id="add-paste"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={8}
            placeholder={
              "Front Range Heating & Air, (303) 555-0142, Mike, Arvada\n" +
              "Summit Plumbing Co, 720-555-0188, , Lakewood\n" +
              "Bluebird Solar, 3035550117"
            }
            className={`${field} mt-1 font-mono text-xs`}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Commas or tabs both work, so a block copied straight out of a spreadsheet is fine.
            Only the business name and phone are required. Anything already on the list is
            skipped and reported rather than duplicated.
          </p>
          <button
            type="submit"
            disabled={pending || !paste.trim()}
            className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-light"
          >
            {pending ? "Adding…" : "Add them"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitOne} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="p-name" className={label}>
              Business name
            </label>
            <input
              id="p-name"
              required
              value={one.businessName}
              onChange={(e) => setOne({ ...one, businessName: e.target.value })}
              className={`${field} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="p-phone" className={label}>
              Phone
            </label>
            <input
              id="p-phone"
              required
              inputMode="tel"
              value={one.phone}
              onChange={(e) => setOne({ ...one, phone: e.target.value })}
              className={`${field} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="p-contact" className={label}>
              Owner / contact
            </label>
            <input
              id="p-contact"
              value={one.contactName}
              onChange={(e) => setOne({ ...one, contactName: e.target.value })}
              className={`${field} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="p-city" className={label}>
              City
            </label>
            <input
              id="p-city"
              value={one.city}
              onChange={(e) => setOne({ ...one, city: e.target.value })}
              className={`${field} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="p-email" className={label}>
              Email (optional)
            </label>
            <input
              id="p-email"
              type="email"
              value={one.email}
              onChange={(e) => setOne({ ...one, email: e.target.value })}
              className={`${field} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-notes" className={label}>
              Anything worth knowing
            </label>
            <input
              id="p-notes"
              value={one.notes}
              onChange={(e) => setOne({ ...one, notes: e.target.value })}
              placeholder="Referred by Dana at Summit. Busy until March."
              className={`${field} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-light"
            >
              {pending ? "Adding…" : "Add to the queue"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-brand-light">
          {error}
        </p>
      )}
      {message && !error && (
        <p className="mt-3 text-sm font-semibold text-brand-cyan">{message}</p>
      )}
      {reasons.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-neutral-500">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
