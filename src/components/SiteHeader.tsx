import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(555) 555-0100";

export default function SiteHeader({
  ctaLabel = "Get a quote",
  ctaHref = "/book",
  phoneHours,
}: {
  ctaLabel?: string;
  ctaHref?: string;
  phoneHours?: string;
}) {
  const isExternalCta = ctaHref.startsWith("tel:") || ctaHref.startsWith("mailto:");

  return (
    <header className="border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <span className="h-2 w-2 rounded-full bg-brand-cyan shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]" />
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/drive"
            className="hidden text-sm font-medium text-slate-400 hover:text-brand-cyan sm:block"
          >
            Drive with us
          </Link>
          <a
            href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
            className="hidden font-mono text-sm text-slate-400 hover:text-brand-cyan sm:block"
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
