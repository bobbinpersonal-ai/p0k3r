"use client";

import { useState } from "react";

// Where a partner actually hands over the list.
//
// A link rather than a file upload, and the copy says why: their customers'
// details stay in their Drive, under their control, revocable by them without
// asking us for anything. That is a better answer for them and a much better
// answer for us than holding a copy of several hundred strangers' phone
// numbers on our own disk.

export default function ShareListCard({
  token,
  currentUrl,
  sharedAt,
}: {
  token: string;
  currentUrl: string | null;
  sharedAt: string | null;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saved, setSaved] = useState<string | null>(currentUrl);
  const [savedAt, setSavedAt] = useState<string | null>(sharedAt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/channel-partners/${token}/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Something went wrong.");
      setSaved(body.url);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-xl font-extrabold text-ink">
        {saved ? "Your customer list" : "Share your customer list"}
      </h2>

      {saved ? (
        <p className="mt-2 text-sm text-neutral-300">
          Shared
          {savedAt
            ? ` ${new Date(savedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}`
            : ""}
          . Paste a new link below if it moves or you want to swap it.
        </p>
      ) : (
        <p className="mt-2 text-sm text-neutral-300">
          Put your customers in a Google Sheet, set it to{" "}
          <strong className="text-neutral-200">Anyone with the link can view</strong>, and paste
          the link here.
        </p>
      )}

      {/* The address ask, given its own block rather than buried in a list of
          nice-to-haves. It is the single field that changes what a crew can
          do with the row — see the columns note below. */}
      <div className="mt-4 rounded-xl border border-white/10 bg-paper/40 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          Columns that help
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300">
          <strong className="text-ink">Name and phone</strong> is enough to start.{" "}
          <strong className="text-ink">Add the address if you have it</strong> — we can look at
          the property before we ring, price the job properly on the first call, and catch the
          houses near one we&apos;re already working on. It is the difference between a call and
          a booked appointment more often than anything else on the sheet.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          Anything else you have — what you did for them, and roughly when — makes the
          conversation land better.
        </p>
      </div>

      <form onSubmit={submit} className="mt-4">
        <label htmlFor="list-url" className="sr-only">
          Link to your customer list
        </label>
        <input
          id="list-url"
          type="url"
          inputMode="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/..."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-brand/50 bg-brand/10 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !url.trim() || url.trim() === saved}
          className="mt-3 w-full rounded-xl bg-brand px-4 py-4 text-base font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : saved ? "Update the link" : "Share my list"}
        </button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-neutral-400">
        We read it, we don&apos;t copy it. Your customers&apos; details stay in your Drive, and you
        can turn off our access any time without asking us to delete anything. We only ever call
        people you have the right to share, and we say who we are on every call.
      </p>
    </div>
  );
}
