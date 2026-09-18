"use client";

import { useTransition, useState } from "react";
import { DESK_ACTIONS } from "@/lib/regions/dispositions";
import { setDisposition } from "./actions";

// One lead, and the five buttons that clear it.
//
// Dense on purpose. This is somebody working a list with a phone in one hand,
// so the buttons are thumb-sized but the rows are not — the whole point is
// seeing the next eight names without scrolling.

export type DeskLead = {
  id: string;
  customerName: string;
  phone: string | null;
  city: string | null;
  partner: string | null;
  disposition: string;
  callCount: number;
  lastCalledLabel: string | null;
};

export default function DeskRow({ lead }: { lead: DeskLead }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  function press(value: string) {
    setError(null);
    start(async () => {
      const res = await setDisposition(lead.id, value);
      if (!res.ok) setError(res.error);
      else setCleared(true);
    });
  }

  const tel = lead.phone ? lead.phone.replace(/[^\d+]/g, "") : null;

  return (
    <tr
      className={`border-b border-white/[0.07] align-middle ${
        cleared ? "opacity-40" : ""
      } ${pending ? "opacity-60" : ""}`}
    >
      <td className="py-2 pr-3">
        <span className="block truncate font-semibold text-ink">{lead.customerName}</span>
        <span className="block truncate text-xs text-neutral-500">
          {[lead.city, lead.partner ? `via ${lead.partner}` : null].filter(Boolean).join(" · ") ||
            "—"}
        </span>
      </td>

      <td className="py-2 pr-3 whitespace-nowrap">
        {tel ? (
          <a href={`tel:${tel}`} className="font-mono text-sm font-semibold text-brand-cyan">
            {lead.phone}
          </a>
        ) : (
          <span className="text-xs text-neutral-600">no number</span>
        )}
      </td>

      <td className="py-2 pr-3 whitespace-nowrap font-mono text-xs text-neutral-500">
        {lead.callCount > 0 ? `${lead.callCount}×` : "—"}
        {lead.lastCalledLabel ? ` · ${lead.lastCalledLabel}` : ""}
      </td>

      <td className="py-2">
        <div className="flex flex-wrap justify-end gap-1">
          {DESK_ACTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              disabled={pending}
              onClick={() => press(d.value)}
              title={d.label}
              className={`rounded border px-2 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide disabled:opacity-50 ${
                d.value === "DEAD"
                  ? "border-white/15 text-neutral-400 hover:border-brand hover:text-brand-light"
                  : d.value === "PITCHED"
                    ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan hover:border-brand-cyan"
                    : "border-white/15 text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-1 text-right text-xs text-brand-light">
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
