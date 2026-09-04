import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Haul";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(555) 555-0100";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-brand-ink">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <a
            href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
            className="hidden text-sm font-medium text-slate-600 hover:text-brand sm:block"
          >
            {SUPPORT_PHONE}
          </a>
          <Link
            href="/book"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Get a quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
