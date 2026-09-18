"use client";

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
  portalToken,
  businessName,
  contactName,
}: {
  portalToken: string;
  businessName: string;
  contactName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const rows: Row[] = [
    { label: "Their portal", path: `/channel-partners/${portalToken}`, primary: true },
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
  const message =
    `Hi ${contactName} — here's your own page for ${businessName}. It shows every customer ` +
    `you send us, what stage they're at and what you've earned, and it's where you share ` +
    `your list:\n\n${origin}/channel-partners/${portalToken}\n\nSave that link — it's the ` +
    `only way back in.`;

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
    </div>
  );
}
