"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// The links for one partner, with the buttons that get them out of here and
// into a text message.
//
// The origin is read from the browser rather than passed down from the server.
// siteOrigin() guesses from Vercel env vars and falls back to localhost, which
// is exactly wrong in the case that matters — somebody on the live admin
// copying a link to text a partner. window.location.origin is the address they
// are actually on, so it is right by construction.
//
// It resolves after hydration, so the first paint shows the path alone rather
// than a localhost URL that would be wrong and copyable for a moment.

type Row = { label: string; path: string; primary?: boolean };

export default function PartnerLinks({
  id,
  portalToken,
  businessName,
  contactName,
  hasPassword,
}: {
  id: string;
  portalToken: string;
  businessName: string;
  contactName: string;
  /** Whether they've claimed the account. Decides which links are useful. */
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Clearing a password locks the partner out of an account that authorises
  // payments, so it asks twice. The second tap is the one that does it.
  async function resetPassword() {
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch("/api/admin/channel-partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reset-password" }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Couldn't reset it.");
      setConfirmReset(false);
      router.refresh();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Couldn't reset it.");
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => setOrigin(window.location.origin), []);

  // Once they've set a password the token stops opening anything, so offering
  // "their portal" as a link would be handing over a dead URL. They get the
  // sign-in page instead, which is the one they actually need read to them.
  const rows: Row[] = hasPassword
    ? [
        { label: "Sign-in page", path: `/channel-partners/login`, primary: true },
        { label: "Marketing kit", path: `/channel-partners/${portalToken}/marketing` },
        {
          label: "Printable leave-behind",
          path: `/channel-partners/${portalToken}/marketing/leave-behind`,
        },
      ]
    : [
        { label: "Their portal", path: `/channel-partners/${portalToken}`, primary: true },
        {
          label: "Set-a-password link",
          path: `/channel-partners/${portalToken}/claim`,
        },
        { label: "Marketing kit", path: `/channel-partners/${portalToken}/marketing` },
        {
          label: "Printable leave-behind",
          path: `/channel-partners/${portalToken}/marketing/leave-behind`,
        },
      ];

  function copy(key: string, text: string) {
    const done = () => {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallback(text, done));
    } else {
      fallback(text, done);
    }
  }

  function fallback(text: string, done: () => void) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    try {
      document.execCommand("copy");
      done();
    } catch {
      /* the URL is on screen and selectable — nothing better to do here */
    }
    document.body.removeChild(ta);
  }

  // What you'd actually send, rather than a bare URL they have to guess at.
  // Different message depending on whether they have an account yet: telling
  // somebody to "save this link" after they've set a password is telling them
  // to save one that no longer works.
  const message = hasPassword
    ? `Hi ${contactName} — sign in for ${businessName} here: ${origin}/channel-partners/login\n\n` +
      `It shows every customer you send us, what stage they're at and what you've earned.`
    : `Hi ${contactName} — here's your own page for ${businessName}. It shows every customer ` +
      `you send us, what stage they're at and what you've earned, and it's where you share ` +
      `your list:\n\n${origin}/channel-partners/${portalToken}\n\nThere's a button on it to ` +
      `set a password, so you're not relying on this text.`;

  return (
    <div className="mt-3 space-y-2">
      {rows.map((row) => {
        const full = origin ? `${origin}${row.path}` : row.path;
        return (
          // Stacked on a phone, one row from sm up. Squeezing a 60-character
          // URL between a label and a button at 390px wraps it to nine lines
          // and makes the button a thumb-sized target next to a wall of text.
          <div
            key={row.path}
            className={`rounded-lg border p-2.5 sm:flex sm:items-center sm:gap-2 ${
              row.primary ? "border-brand-cyan/30 bg-brand-cyan/[0.06]" : "border-white/10"
            }`}
          >
            <span className="block font-mono text-[10px] uppercase tracking-widest text-neutral-400 sm:shrink-0">
              {row.label}
            </span>
            <a
              href={row.path}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all font-mono text-xs text-brand-cyan hover:text-ink sm:mt-0 sm:min-w-0 sm:flex-1"
            >
              {full}
            </a>
            <button
              type="button"
              onClick={() => copy(row.path, full)}
              className="mt-2 w-full rounded-md border border-white/15 px-2.5 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand-cyan sm:mt-0 sm:w-auto sm:shrink-0 sm:py-1"
            >
              {copied === row.path ? "Copied" : "Copy"}
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => copy("message", message)}
        className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand-cyan"
      >
        {copied === "message" ? "Copied — paste it into Messages" : "Copy the whole text message"}
      </button>

      {hasPassword && (
        <div className="pt-1">
          {confirmReset ? (
            <div className="rounded-lg border border-brand/40 bg-brand/[0.08] p-3">
              <p className="text-xs text-ink">
                This clears {businessName}&apos;s password and signs them out everywhere. They
                set a new one from the link that appears here afterwards.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={resetting}
                  onClick={resetPassword}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                >
                  {resetting ? "Resetting…" : "Yes, reset it"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-bold text-neutral-300"
                >
                  Cancel
                </button>
              </div>
              {resetError && (
                <p role="alert" className="mt-2 text-xs text-ink">
                  {resetError}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-semibold text-neutral-400 underline hover:text-ink"
            >
              Reset their password
            </button>
          )}
        </div>
      )}
    </div>
  );
}
