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

  return (
    <header
      className={
        transparent
          ? "relative z-10 bg-transparent"
          : "border-b border-black/10 bg-paper/80 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/">
          <Logo name={SITE_NAME} light={transparent} />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/drive"
            className={`hidden text-sm font-medium sm:block ${
              transparent
                ? "text-white/90 hover:text-white"
                : "text-neutral-500 hover:text-brand-cyan"
            }`}
          >
            Drive with us
          </Link>
          <a
            href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
            className={`hidden font-mono text-sm sm:block ${
              transparent
                ? "text-white/90 hover:text-white"
                : "text-neutral-500 hover:text-brand-cyan"
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
    </header>
  );
}
