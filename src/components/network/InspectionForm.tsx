"use client";

import { useState } from "react";
import { CONTACT_CONSENT_TEXT } from "@/lib/regions/brand";
import { TRADES } from "@/lib/regions/trades";
import { REGIONS, regionForZip } from "@/lib/regions/states";

// The form the whole page exists to feed.
//
// Few fields, because every extra one costs conversions. The trade dropdown
// earns its place by routing the lead; the ZIP earns its place twice over,
// because it decides which state's rules apply and which crew gets sent.
//
// ZIP is asked for rather than the state, and the state is inferred from it.
// Homeowners type their own ZIP accurately and reliably; they scroll past a
// state dropdown. The inference is shown back to them so a mistyped ZIP is
// visible rather than silently routing somebody to the wrong state — and a ZIP
// outside the five states we cover says so immediately instead of taking a
// stranger's details for a lead nobody can serve.
//
// The consent line is the important part. It is a visible sentence and an
// unticked box — never pre-ticked, never hidden behind a link — and the server
// stores the wording the person actually saw rather than a boolean. That
// record is what makes an inbound lead legally callable, and it is worth
// nothing if we cannot produce the exact text two years later.

const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function InspectionForm({
  source = "website",
  // The page renders this twice — hero and footer — so the anchor id has to
  // differ. Duplicate ids are invalid HTML and quietly break both the header's
  // jump link and anything reading the page by id.
  id = "inspection",
}: {
  source?: string;
  id?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [zip, setZip] = useState("");

  // Resolved on every keystroke: undefined until five digits, then either a
  // state we serve or nothing, which is itself the answer.
  const region = regionForZip(zip);
  const zipComplete = zip.replace(/\D/g, "").length >= 5;
  const outOfArea = zipComplete && !region;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          address: form.get("address"),
          zip: zip.replace(/\D/g, "").slice(0, 5),
          // Sent explicitly rather than left for the server to re-derive: this
          // is what the homeowner was shown on screen, and the record should
          // match what they saw.
          state: region?.code ?? null,
          trade: form.get("trade") || null,
          consent,
          source,
          // Recorded with the consent so we know which page's wording they saw.
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Something went wrong. Please call us.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand/40 bg-brand/10 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Got it</p>
        <h3 className="mt-2 text-xl font-extrabold text-ink">We&apos;ll call you today.</h3>
        <p className="mt-2 text-sm text-neutral-200">
          We&apos;ll ring to set a time and send a crew we&apos;ve vetted in your area. The
          inspection takes about forty minutes and you&apos;ll have a written scope whether
          there&apos;s damage or not — with no obligation to hire us.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      id={id}
      className="scroll-mt-20 rounded-2xl border border-white/10 bg-paper/80 p-5 backdrop-blur"
    >
      <h2 className="text-xl font-extrabold text-ink">Get your free inspection</h2>
      {/* The easy question first. A dropdown costs one tap and gets somebody
          into the form before a stranger asks for their name and address.
          The two options that shared value="" made the default state
          ambiguous; the prompt is the empty one, and "not sure" is a real
          answer with a value of its own. */}
      <div className="mt-4 space-y-3">
        <select name="trade" defaultValue="" className={FIELD} aria-label="What needs work">
          <option value="">What needs work?</option>
          {TRADES.map((trade) => (
            <option key={trade.value} value={trade.value}>
              {trade.label}
            </option>
          ))}
          <option value="NOT_SURE">Not sure — come and look</option>
        </select>
        <input name="customerName" required placeholder="Name" autoComplete="name" className={FIELD} />
        <input
          name="customerPhone"
          type="tel"
          inputMode="tel"
          required
          placeholder="Phone"
          autoComplete="tel"
          className={FIELD}
        />
        <input
          name="address"
          required
          placeholder="Property address"
          autoComplete="street-address"
          className={FIELD}
        />
        <div>
          <input
            name="zip"
            required
            inputMode="numeric"
            maxLength={10}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            autoComplete="postal-code"
            aria-describedby={`${id}-zip-note`}
            className={FIELD}
          />
          <p
            id={`${id}-zip-note`}
            role={outOfArea ? "alert" : undefined}
            className={`mt-1.5 text-xs ${outOfArea ? "text-brand-cyan" : "text-neutral-400"}`}
          >
            {region
              ? `${region.name} — we're already working there.`
              : outOfArea
                ? `We don't cover that ZIP yet. Right now we're in ${REGIONS.map((r) => r.name).join(", ")}.`
                : `We cover ${REGIONS.map((r) => r.code).join(", ")}.`}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || outOfArea}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : outOfArea ? "Not in our area yet" : "Book my free inspection"}
      </button>

      {/* Never pre-ticked. An unticked box is a lead we may work by other
          means, not a number we may dial. */}
      <label className="mt-4 flex cursor-pointer gap-3 text-xs leading-relaxed text-neutral-400">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>{CONTACT_CONSENT_TEXT}</span>
      </label>
    </form>
  );
}
