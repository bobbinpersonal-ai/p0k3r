"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CrewSignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/crew/auth/logout", { method: "POST" });
        router.push("/crew/login");
        router.refresh();
      }}
      className="ml-auto shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-ink hover:border-[color:var(--rc-dim)] disabled:opacity-50"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}
