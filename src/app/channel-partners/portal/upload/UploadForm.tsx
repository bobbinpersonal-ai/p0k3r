"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Track = { value: string; label: string; blurb: string };
type Result = {
  imported: number;
  alreadyKnown: number;
  skippedNoPhone: number;
  skippedOutOfArea: number;
};

export default function UploadForm({
  tracks,
  currentTrack,
}: {
  tracks: Track[];
  currentTrack: string;
}) {
  const router = useRouter();
  const [track, setTrack] = useState(currentTrack);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csv, setCsv] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Result | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    // Read in the browser and post the text: the file never becomes an upload
    // we have to store, and a partner's customer list never sits in a bucket.
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/channel-partners/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, track }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't read that file.");
      setDone(body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-brand-cyan/40 bg-brand-cyan/[0.08] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-cyan">Loaded</p>
        <p className="mt-2 text-2xl font-extrabold text-ink">
          {done.imported.toLocaleString("en-US")} customers
        </p>
        <ul className="mt-3 space-y-1 text-sm text-neutral-300">
          {done.alreadyKnown > 0 && (
            <li>{done.alreadyKnown} were already in our system — left exactly as they were.</li>
          )}
          {done.skippedNoPhone > 0 && (
            <li>{done.skippedNoPhone} skipped: no name or no usable phone number.</li>
          )}
          {done.skippedOutOfArea > 0 && (
            <li>{done.skippedOutOfArea} skipped: outside the states we cover.</li>
          )}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-neutral-300">
          Nobody gets called until the introduction has gone out. You&apos;ll see each of them
          move through the stages on your page.
        </p>
        <a
          href="/channel-partners/portal"
          className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white"
        >
          Back to my page
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="text-lg font-bold text-ink">How should we approach them?</h2>
        <p className="mt-1 text-sm text-neutral-400">
          This is the part that decides whether your customers feel looked after or cold-called.
        </p>
        <div className="mt-4 space-y-2">
          {tracks.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTrack(t.value)}
              className={`w-full rounded-xl border p-4 text-left ${
                t.value === track
                  ? "border-brand-cyan/60 bg-brand-cyan/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    t.value === track ? "border-brand-cyan bg-brand-cyan" : "border-white/25"
                  }`}
                />
                <span className="font-bold text-ink">{t.label}</span>
              </span>
              <span className="mt-1.5 block pl-5 text-sm leading-relaxed text-neutral-400">
                {t.blurb}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-ink">The file</h2>
        <p className="mt-1 text-sm leading-relaxed text-neutral-400">
          A CSV with a <b className="text-neutral-200">Name</b> column and a{" "}
          <b className="text-neutral-200">Phone</b> column. Email, address, city and ZIP are used
          if they&apos;re there. Any order, any extra columns — we ignore what we don&apos;t need.
        </p>

        <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-8 text-center hover:border-brand-cyan/50">
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
          <span className="text-sm text-neutral-300">
            {fileName ? (
              <>
                <b className="text-ink">{fileName}</b>
                <br />
                <span className="text-xs text-neutral-500">Tap to choose a different one</span>
              </>
            ) : (
              "Choose a CSV file"
            )}
          </span>
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={busy || !csv}
        onClick={submit}
        className="w-full rounded-xl bg-brand px-6 py-4 text-base font-bold text-white disabled:opacity-50"
      >
        {busy ? "Reading it…" : "Upload my list"}
      </button>

      <p className="text-center text-xs leading-relaxed text-neutral-500">
        The file is read in your browser and the rows come to us — we never store the file itself.
        Anyone who asks not to be contacted goes on our do-not-call list permanently.
      </p>
    </div>
  );
}
