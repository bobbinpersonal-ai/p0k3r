"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Who you're signed in as, and the way out.
//
// A thin strip rather than a nav, because the portal below it is the page and
// this is furniture. The sign-out posts rather than links: it deletes the
// session row, and a GET that destroys something is a link a browser can
// prefetch.

export default function PartnerSessionBar({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/channel-partners/auth/logout", { method: "POST" });
      router.push("/channel-partners/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-white/10 bg-white/[0.03]">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-xs text-neutral-400">
          Signed in as <span className="font-semibold text-ink">{businessName}</span>
        </p>
        <button
          type="button"
          onClick={signOut}
          disabled={busy}
          className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand-cyan disabled:opacity-50"
        >
          {busy ? "…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
