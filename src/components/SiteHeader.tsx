"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";

export default function SiteHeader({
  ctaLabel = "Get my price",
  ctaHref = "/yard",
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
        {/* The other two businesses. They're only reachable from the homepage
            otherwise, and a landscaping customer who also needs a truck has no
            reason to guess that the same company owns one. Hidden below sm
            along with everything else in the nav — a phone gets the logo and
            the CTA, and the rest is on the page. */}
        <Link
          href="/moving"
          className={`hidden text-sm font-medium lg:block ${
            isLight ? "text-white/90 hover:text-white" : "text-neutral-300 hover:text-brand-cyan"
          }`}
        >
          Moving
        </Link>
        <Link
          href="/junk-removal"
          className={`hidden text-sm font-medium lg:block ${
            isLight ? "text-white/90 hover:text-white" : "text-neutral-300 hover:text-brand-cyan"
          }`}
        >
          Junk removal
        </Link>
        <Link
          href="/drive"
          className={`hidden text-sm font-medium sm:block ${
            isLight ? "text-white/90 hover:text-white" : "text-neutral-300 hover:text-brand-cyan"
          }`}
        >
          Work with us
        </Link>
        <a
          href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
          className={`hidden font-mono text-sm sm:block ${
            isLight ? "text-white/90 hover:text-white" : "text-neutral-300 hover:text-brand-cyan"
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
            ? // Not fully transparent: the nav renders in white so it can sit
              // over the hero video, and "white text over a video" is only
              // legible if the video happens to be dark at the top. Ours is a
              // daylight clip that brightens as it plays, and the nav was
              // washing out. A short scrim behind the bar — dark at the very
              // top, gone by the bottom of it — keeps the "video runs to the
              // top of the page" look while giving the text something to sit
              // on in every frame. Sized to the bar, so nothing below it is
              // tinted.
              "fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/45 via-black/25 to-transparent"
            : // Solid, not translucent+blurred: a fixed header with
              // backdrop-blur sitting over smooth-scrolling content is a
              // well-documented WebKit compositor bug (see globals.css) —
              // worth staying away from the trigger entirely, not just the
              // scroll-behavior half of it, on older/weaker GPUs.
              "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-paper"
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
