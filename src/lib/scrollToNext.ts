import type { RefObject } from "react";

// Used by click-to-select form questions (radio cards) to auto-advance to
// the next question once an answer is picked, instead of leaving the user
// to scroll down themselves. Waits a tick so newly-revealed conditional
// fields (an "other, please specify" textarea, etc.) are laid out first.
export function scrollToNext(ref: RefObject<HTMLElement>) {
  requestAnimationFrame(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });
}
