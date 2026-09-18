"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CADENCE,
  CADENCE_LENGTH,
  PROSPECT_ACTIONS,
  currentTouch,
  getProspectTrade,
  greetingName,
  isBusinessGreeting,
  MIN_VIABLE_LIST,
  pitch,
  touchEmail,
  touchText,
  type Objection,
} from "@/lib/regions/partnerProspects";
import { logCall, setListSize } from "./actions";
import { useRecruiterName } from "./useRecruiterName";

// One prospect, all three channels, and a Next button.
//
// The shape is taken from the sales consoles reps actually live in: the whole
// queue is loaded once, and moving to the next prospect is a state change
// rather than a page load. That is the entire difference between a tool
// somebody works for an hour and a tool somebody abandons — a 400ms round trip
// between every call is four minutes of dead air in a sixty-call session, and
// it is felt as hesitation rather than as latency.
//
// So: logging a call fires the server action and advances immediately, without
// waiting. The action is a write nobody is reading back on this screen, and
// the local copy already knows what changed. If it fails, the banner says so
// and names who it was, because the one thing worse than a slow desk is a desk
// that silently loses a call.

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
  cadenceStep: number;
  lastCalledLabel: string | null;
  dueLabel: string | null;
};

type Failure = { business: string; error: string };

/** Cursor value meaning "walked off the end", distinct from "not set yet". */
const END = "__end__";

export default function CallConsole({
  queue,
  signupUrl,
  objections,
  scheduledLater,
}: {
  queue: readonly Prospect[];
  signupUrl: string;
  objections: readonly Objection[];
  /** In sequence but not due yet — so an empty queue can say which kind of empty. */
  scheduledLater: number;
}) {
  // The cursor is a prospect id, never a position.
  //
  // Logging a call revalidates the page, and the prospect just worked drops
  // out of the due-now queue as soon as its next touch is booked. With a
  // numeric index that shortening slides the cursor past the following name:
  // log A at index 0, advance to 1, the server drops A, and index 1 is now C.
  // B never gets rung and nothing anywhere says so. Holding an id instead
  // means the queue can shrink, grow or reorder underneath and the person on
  // screen stays the person on screen.
  //
  // null means "wherever the first unworked one is", and END means the caller
  // has walked off the end of the list.
  const [cursor, setCursor] = useState<string | null>(null);
  const [callerName, rememberName] = useRecruiterName();
  const [notes, setNotes] = useState("");
  const [size, setSize] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [worked, setWorked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [openObjection, setOpenObjection] = useState<string | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const index = useMemo(() => {
    if (cursor === END) return queue.length;
    if (cursor) {
      const found = queue.findIndex((q) => q.id === cursor);
      if (found >= 0) return found;
    }
    const fresh = queue.findIndex((q) => !worked.has(q.id));
    return fresh >= 0 ? fresh : queue.length;
  }, [queue, cursor, worked]);

  const prospect = queue[index] ?? null;
  const trade = getProspectTrade(prospect?.trade ?? null);

  // The touch this call IS — one past whatever has already been done.
  const step = Math.min((prospect?.cadenceStep ?? 0) + 1, CADENCE_LENGTH);
  const touch = currentTouch(step);

  const facts = useMemo(
    () => ({
      callerName,
      businessName: prospect?.businessName ?? "",
      contactName: prospect?.contactName ?? "",
      url: signupUrl,
    }),
    [callerName, prospect?.businessName, prospect?.contactName, signupUrl],
  );

  // Regenerated for whoever is on screen now, which is the whole point: the
  // name and business in the message are never the last prospect's.
  const generated = prospect ? touchText(step, facts) : "";
  const message = draft ?? generated;
  const email = prospect ? touchEmail(step, facts) : { subject: "", body: "" };

  const steps = prospect
    ? pitch({
        callerName,
        businessName: prospect.businessName,
        contactName: prospect.contactName,
        trade: prospect.trade,
      })
    : [];

  // Everything typed belongs to the prospect it was typed against.
  const advance = useCallback((to: string | null) => {
    setCursor(to);
    setNotes("");
    setSize("");
    setDraft(null);
    setCopied(null);
  }, []);

  const next = useCallback(() => {
    advance(queue[index + 1]?.id ?? END);
  }, [queue, index, advance]);

  const back = useCallback(() => {
    if (index > 0) advance(queue[index - 1]?.id ?? null);
  }, [queue, index, advance]);

  const press = useCallback(
    (outcome: string) => {
      if (!prospect) return;
      const id = prospect.id;
      const business = prospect.businessName;
      const typedNotes = notes;
      const typedSize = size;

      setWorked((w) => new Set(w).add(id));
      next();

      void (async () => {
        const res = await logCall(id, outcome, typedNotes || undefined);
        if (!res.ok) setFailures((f) => [...f, { business, error: res.error }]);
        if (typedSize.trim()) await setListSize(id, typedSize);
      })();
    },
    [prospect, notes, size, next],
  );

  // Keyboard, because a mouse between every call is the slow part. Digits map
  // to the outcome buttons in the order they are drawn; n and b move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        // Except Escape, so there is always a way out of a field.
        if (e.key === "Escape") el.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "n" || e.key === "ArrowRight") { e.preventDefault(); next(); return; }
      if (e.key === "b" || e.key === "ArrowLeft") { e.preventDefault(); back(); return; }
      if (e.key === "/") { e.preventDefault(); notesRef.current?.focus(); return; }

      const n = Number.parseInt(e.key, 10);
      if (Number.isFinite(n) && n >= 1 && n <= PROSPECT_ACTIONS.length) {
        e.preventDefault();
        press(PROSPECT_ACTIONS[n - 1].value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, press]);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setFailures((f) => [...f, { business: "Clipboard", error: "Couldn't copy — select it by hand." }]);
    }
  }

  if (!prospect) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
        <p className="text-lg font-bold text-ink">
          {queue.length > 0
            ? "That's everything due."
            : scheduledLater > 0
              ? "Nothing due right now."
              : "Nobody in the queue."}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-400">
          {queue.length > 0
            ? `You worked ${worked.size} of ${queue.length}. Reload for whatever comes due next.`
            : scheduledLater > 0
              ? `${scheduledLater} ${
                  scheduledLater === 1 ? "prospect is" : "prospects are"
                } booked for a later touch. Add fresh names below rather than ringing them early — the gaps are what keep it persistent instead of annoying.`
              : "Paste some contractors in below. Twenty names is an hour of calling."}
        </p>
        {queue.length > 0 && (
          <button
            type="button"
            onClick={() => advance(null)}
            className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
          >
            Back to the top
          </button>
        )}
      </div>
    );
  }

  const tel = prospect.phone.replace(/[^\d+]/g, "");
  const isApple = typeof navigator !== "undefined" && /iPhone|iPad|Mac/.test(navigator.userAgent);
  const smsHref = `sms:${tel}${isApple ? "&" : "?"}body=${encodeURIComponent(message)}`;
  const listNumber = Number.parseInt(size, 10);
  const tooSmall = Number.isFinite(listNumber) && listNumber > 0 && listNumber < MIN_VIABLE_LIST;
  const usingBusinessName = isBusinessGreeting(prospect);

  const field =
    "w-full rounded-lg border border-white/15 bg-paper/60 px-3 py-2 text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none";

  return (
    <div className="space-y-4">
      {failures.length > 0 && (
        <div role="alert" className="rounded-xl border border-brand/40 bg-brand/10 p-3">
          {failures.map((f, i) => (
            <p key={`${f.business}-${i}`} className="text-sm text-brand-light">
              <strong>{f.business}:</strong> {f.error}
            </p>
          ))}
        </div>
      )}

      {/* Position, and the name that goes in everything below it. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            {index + 1} of {queue.length}
          </span>
          <span className="font-mono text-xs text-neutral-600">·</span>
          <span className="font-mono text-xs text-brand-cyan">{worked.size} worked</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="caller-name" className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            You are
          </label>
          <input
            id="caller-name"
            value={callerName}
            onChange={(e) => rememberName(e.target.value)}
            placeholder="your name"
            className="w-36 rounded border border-white/15 bg-paper/60 px-2 py-1 text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none"
          />
          {!callerName.trim() && (
            <span className="text-[11px] text-amber-500/80">name goes in every message</span>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="min-w-0 space-y-4">
          {/* Who, and the number. The largest thing on the page. */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                  {prospect.businessName}
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {[
                    prospect.contactName || "no owner name on file",
                    trade?.label ?? null,
                    [prospect.city, prospect.state].filter(Boolean).join(", ") || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  {prospect.callCount > 0 ? `${prospect.callCount}× touched` : "never touched"}
                  {prospect.lastCalledLabel ? ` · ${prospect.lastCalledLabel} ago` : ""}
                  {prospect.dueLabel ? ` · due ${prospect.dueLabel}` : ""}
                </p>
              </div>
              <a
                href={`tel:${tel}`}
                className="rounded-xl border border-brand-cyan bg-brand-cyan/15 px-5 py-3 text-center hover:bg-brand-cyan/25"
              >
                <span className="block font-mono text-[10px] uppercase tracking-widest text-brand-cyan/80">
                  Call
                </span>
                <span className="block font-mono text-xl font-bold text-brand-cyan">
                  {prospect.phone}
                </span>
              </a>
            </div>

            {touch && (
              <p className="mt-4 rounded-lg border border-white/10 bg-paper/50 px-3 py-2 text-xs text-neutral-300">
                <span className="font-mono uppercase tracking-widest text-brand-cyan">
                  Touch {step} of {CADENCE_LENGTH} · {touch.channel.toLowerCase()}
                </span>{" "}
                — {touch.label}. {touch.intent}
              </p>
            )}

            {trade && (
              <p className="mt-2 rounded-lg border border-brand-cyan/20 bg-brand-cyan/[0.06] px-3 py-2 text-xs leading-relaxed text-neutral-300">
                {trade.why}{" "}
                <span className="text-neutral-500">Usually {trade.typicalList} customers.</span>
              </p>
            )}

            {prospect.notes && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">{prospect.notes}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label htmlFor="list-size" className="text-xs text-neutral-400">
                Past customers:
              </label>
              <input
                id="list-size"
                type="number"
                min={0}
                inputMode="numeric"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder={prospect.approxListSize != null ? String(prospect.approxListSize) : "—"}
                className="w-28 rounded border border-white/15 bg-paper/60 px-2 py-1 font-mono text-sm text-ink placeholder:text-neutral-600 focus:border-brand-cyan focus:outline-none"
              />
              {tooSmall && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500/90">
                  under {MIN_VIABLE_LIST} — park it
                </span>
              )}
            </div>
          </div>

          {/* The message, already written, with their name in it. */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">
                Text — written for {greetingName(prospect)}
              </h3>
              {usingBusinessName && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  no owner name, using the business
                </span>
              )}
            </div>
            <textarea
              value={message}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className={`${field} mt-2 text-sm`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href={smsHref}
                className="rounded border border-brand-cyan/50 bg-brand-cyan/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-brand-cyan hover:border-brand-cyan"
              >
                Send text
              </a>
              <button
                type="button"
                onClick={() => copy(message, "sms")}
                className="rounded border border-white/15 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
              >
                {copied === "sms" ? "Copied" : "Copy"}
              </button>
              {prospect.email ? (
                <>
                  <a
                    href={`mailto:${prospect.email}?subject=${encodeURIComponent(
                      email.subject,
                    )}&body=${encodeURIComponent(email.body)}`}
                    className="rounded border border-white/15 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
                  >
                    Email
                  </a>
                  <button
                    type="button"
                    onClick={() => copy(`${email.subject}\n\n${email.body}`, "email")}
                    className="rounded border border-white/15 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
                  >
                    {copied === "email" ? "Copied" : "Copy email"}
                  </button>
                </>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                  no email on file
                </span>
              )}
              {draft !== null && (
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 underline hover:text-ink"
                >
                  Reset to the template
                </button>
              )}
            </div>
          </div>

          {/* What happened, and on to the next one. */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What they said — goes on the call log.   ( / to jump here, Esc to leave )"
              className={`${field} text-sm`}
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PROSPECT_ACTIONS.map((d, i) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => press(d.value)}
                  title={`${d.label}  (${i + 1})`}
                  className={`rounded border px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide ${
                    d.tone === "GOOD"
                      ? "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan hover:border-brand-cyan"
                      : d.tone === "BAD"
                        ? "border-white/15 text-neutral-400 hover:border-brand hover:text-brand-light"
                        : "border-white/15 text-neutral-200 hover:border-brand-cyan hover:text-brand-cyan"
                  }`}
                >
                  <span className="mr-1.5 text-neutral-600">{i + 1}</span>
                  {d.short}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={back}
                disabled={index === 0}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-neutral-300 disabled:opacity-40 hover:border-brand-cyan hover:text-brand-cyan"
              >
                ← Back
              </button>
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                1–8 log · n next · b back · / notes
              </span>
              <button
                type="button"
                onClick={next}
                disabled={index >= queue.length - 1}
                className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-brand-light"
              >
                Skip · Next call →
              </button>
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">The call</h3>
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="rounded border border-white/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-neutral-400 hover:border-brand-cyan hover:text-brand-cyan"
              >
                {showNotes ? "Hide why" : "Why"}
              </button>
            </div>
            <ol className="mt-3 space-y-2">
              {steps.map((s, i) => (
                <li key={s.heading} className="rounded-lg border border-white/10 bg-paper/40 p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
                    {String(i + 1).padStart(2, "0")} · {s.heading}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{s.say}</p>
                  {showNotes && (
                    <p className="mt-1.5 border-t border-white/10 pt-1.5 text-xs leading-relaxed text-neutral-400">
                      {s.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-bold text-ink">When they push back</h3>
            <ul className="mt-2 space-y-1">
              {objections.map((o) => (
                <li key={o.says}>
                  <button
                    type="button"
                    onClick={() => setOpenObjection(openObjection === o.says ? null : o.says)}
                    aria-expanded={openObjection === o.says}
                    className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-paper/40 px-2.5 py-1.5 text-left text-xs font-semibold text-ink hover:border-brand-cyan/40"
                  >
                    <span className="font-mono text-brand-cyan">
                      {openObjection === o.says ? "−" : "+"}
                    </span>
                    <span>{o.says}</span>
                  </button>
                  {openObjection === o.says && (
                    <p className="mt-1 rounded-lg border border-brand-cyan/20 bg-brand-cyan/[0.06] px-2.5 py-2 text-xs leading-relaxed text-neutral-200">
                      {o.answer}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Where this one sits in the sequence, and what is coming. */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-bold text-ink">The follow-up</h3>
            <p className="mt-1 text-xs text-neutral-500">
              Eight touches over eighteen days. Logging an outcome books the next one.
            </p>
            <ol className="mt-3 space-y-1">
              {CADENCE.map((c) => (
                <li
                  key={c.step}
                  className={`flex items-baseline gap-2 rounded px-2 py-1 text-xs ${
                    c.step === step
                      ? "bg-brand-cyan/10 text-ink"
                      : c.step < step
                        ? "text-neutral-600"
                        : "text-neutral-400"
                  }`}
                >
                  <span className="font-mono text-[10px] text-neutral-500">d{c.day}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-brand-cyan/70">
                    {c.channel}
                  </span>
                  <span className={c.step < step ? "line-through" : ""}>{c.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* What is coming, so the next few names are never a surprise. */}
      {queue.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-bold text-ink">Up next</h3>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {queue.slice(index + 1, index + 10).map((q, i) => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => advance(q.id)}
                  className="w-full truncate rounded px-2 py-1 text-left text-xs text-neutral-400 hover:bg-white/5 hover:text-ink"
                >
                  <span className="font-mono text-neutral-600">{index + 2 + i}.</span>{" "}
                  {q.businessName}
                  {q.city ? <span className="text-neutral-600"> · {q.city}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
