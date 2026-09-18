"use client";

import { useState } from "react";
import { pitch, type Objection } from "@/lib/regions/partnerProspects";
import { useRecruiterName } from "./useRecruiterName";

// The script, on screen while the phone is ringing.
//
// Sticky rather than collapsible-by-default: the whole failure mode of a
// written pitch is that it lives in a doc nobody opens once they think they
// know it, and then the fourth point quietly stops getting said. The notes
// under each line are for whoever runs this desk after the owner does — they
// explain why the wording is the wording, which is the part that does not
// survive being retyped from memory.
//
// Built here rather than on the server so the caller's own name can go in it.
// pitch() is pure — it reads two constants and returns strings — so it costs
// nothing to run in the browser, and the alternative was a script that opens
// "it's LoveMeAfter from LoveMeAfter".

export default function CallScript({
  prospect,
  objections,
}: {
  prospect: { businessName: string; contactName: string; trade: string | null } | null;
  objections: readonly Objection[];
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [callerName, rememberName] = useRecruiterName();

  const steps = pitch({
    // Passed raw: pitch() supplies its own "[your name]" placeholder, and two
    // different placeholders for one empty field is how they drift apart.
    callerName,
    businessName: prospect?.businessName ?? "their business",
    contactName: prospect?.contactName,
    trade: prospect?.trade,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">The call</h2>
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="rounded border border-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-neutral-400 hover:border-brand-cyan hover:text-brand-cyan"
          >
            {showNotes ? "Hide why" : "Why it's worded this way"}
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Ninety seconds to the ask. Say it, don&apos;t read it.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="caller-name" className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            You are
          </label>
          <input
            id="caller-name"
            value={callerName}
            onChange={(e) => rememberName(e.target.value)}
            placeholder="your name"
            className="w-40 rounded border border-white/15 bg-paper/60 px-2 py-1 text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none"
          />
          {!callerName.trim() && (
            <span className="text-[11px] text-amber-500/80">put your name in first</span>
          )}
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={s.heading} className="rounded-xl border border-white/10 bg-paper/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
                {String(i + 1).padStart(2, "0")} · {s.heading}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{s.say}</p>
              {showNotes && (
                <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-neutral-400">
                  {s.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-bold text-ink">When they push back</h2>
        <p className="mt-1 text-xs text-neutral-500">Tap one to open the answer.</p>
        <ul className="mt-3 space-y-1.5">
          {objections.map((o) => (
            <li key={o.says}>
              <button
                type="button"
                onClick={() => setOpen(open === o.says ? null : o.says)}
                aria-expanded={open === o.says}
                className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-paper/40 px-3 py-2 text-left text-sm font-semibold text-ink hover:border-brand-cyan/40"
              >
                <span className="mt-0.5 font-mono text-xs text-brand-cyan">
                  {open === o.says ? "−" : "+"}
                </span>
                <span>{o.says}</span>
              </button>
              {open === o.says && (
                <div className="mt-1 rounded-lg border border-brand-cyan/20 bg-brand-cyan/[0.06] px-3 py-2">
                  <p className="text-sm leading-relaxed text-neutral-200">{o.answer}</p>
                  <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-neutral-400">
                    {o.note}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
