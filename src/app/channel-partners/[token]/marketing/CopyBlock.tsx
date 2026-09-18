"use client";

import { useState } from "react";

// Copy-to-clipboard for a pitch template.
//
// The clipboard API needs a secure context and a user gesture, and it still
// fails on some in-app browsers, so there is a textarea fallback and a final
// "select it yourself" message rather than a button that silently does
// nothing. A partner who taps Copy, pastes nothing, and gets no explanation
// concludes the whole portal is broken.

export default function CopyBlock({ label, body }: { label: string; body: string }) {
  const [state, setState] = useState<"idle" | "done" | "manual">("idle");

  function copy() {
    const done = () => {
      setState("done");
      setTimeout(() => setState("idle"), 1800);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body).then(done, fallback);
    } else {
      fallback();
    }

    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = body;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, body.length);
      try {
        document.execCommand("copy");
        done();
      } catch {
        setState("manual");
        setTimeout(() => setState("idle"), 3000);
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-base font-bold text-ink">{label}</h3>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-paper/50 p-4 font-sans text-sm leading-relaxed text-neutral-200">
        {body}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand-cyan"
      >
        {state === "done" ? "Copied" : state === "manual" ? "Select the text above to copy" : "Copy"}
      </button>
    </div>
  );
}
