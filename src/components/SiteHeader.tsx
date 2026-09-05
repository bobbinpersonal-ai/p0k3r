"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";

export default function SiteHeader({
  ctaLabel = "Get a quote",
  ctaHref = "/book",
  phoneHours,
  transparent = false,
}: {
  ctaLabel?: string;
  ctaHref?: string;
  phoneHours?: string;
  transparent?: boolean;
}) {
  const isExternalCta = ctaHref.startsWith("tel:") || ctaHref.startsWith("mailto:");

  // The header is fixed so it stays put (and the "Get a quote" button stays
  // reachable) for the whole scroll, not just while its section is in view.
  // On the homepage it starts transparent over the hero video, then swaps to
  // the solid style as soon as the page scrolls.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const isLight = transparent && !scrolled;

  const content = (
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/">
        <Logo name={SITE_NAME} />
      </Link>
      <nav className="flex items-center gap-4 sm:gap-6">
        <Link
          href="/drive"
          className={`hidden text-sm font-medium sm:block ${
            isLight ? "text-white/90 hover:text-white" : "text-neutral-500 hover:text-brand-cyan"
          }`}
        >
          Drive with us
        </Link>
        <a
          href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
          className={`hidden font-mono text-sm sm:block ${
            isLight ? "text-white/90 hover:text-white" : "text-neutral-500 hover:text-brand-cyan"
          }`}
        >
          {SUPPORT_PHONE}
          {phoneHours ? ` · ${phoneHours}` : ""}
        </a>
        {isExternalCta ? (
          <a
            href={ctaHref}
            className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {ctaLabel}
          </a>
        ) : (
          <Link
            href={ctaHref}
            className="rounded-full bg-gradient-to-r from-brand to-brand-cyan px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            {ctaLabel}
          </Link>
        )}
      </nav>
    </div>
  );

  return (
    <>
      <header
        className={
          isLight
            ? "fixed inset-x-0 top-0 z-50 bg-transparent"
            : "fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-paper/80 backdrop-blur"
        }
      >
        {content}
      </header>
      {/* Fixed headers don't reserve space in normal flow, so on pages with
          a solid (non-transparent) header this invisible clone holds the
          same height in place, pushing the page's real content down below
          the fixed bar above it. The transparent homepage header skips this
          on purpose — its hero is meant to run up behind the nav. */}
      {!transparent && (
        <div aria-hidden className="invisible">
          {content}
        </div>
      )}
    </>
  );
}
