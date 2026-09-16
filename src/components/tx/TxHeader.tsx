import Link from "next/link";
import { COMPANY, PHONE_DIGITS } from "@/lib/texas/brand";

// The Texas site's own header, separate from the California one rather than a
// prop on it. The two businesses share a database and a deploy and almost
// nothing else, and a shared header would mean every nav change to one needed
// checking against the other.

export default function TxHeader({ ctaHref = "#inspection" }: { ctaHref?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
          {COMPANY.name}
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-neutral-300 md:flex">
          <a href="#trades" className="hover:text-ink">Services</a>
          <a href="#storm" className="hover:text-ink">Storm damage</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <Link href="/sell" className="hover:text-ink">Sales jobs</Link>
          <Link href="/crew" className="hover:text-ink">Crews</Link>
        </nav>

        {/* On a phone this is the conversion event, not the form: most of this
            traffic is a homeowner checking we're real mid-conversation. */}
        <a
          href={`tel:${PHONE_DIGITS}`}
          className="ml-auto rounded-full border border-white/15 px-3 py-2 font-mono text-sm font-semibold text-ink hover:border-brand hover:text-brand-cyan md:ml-0"
        >
          {COMPANY.phone}
        </a>
        <a
          href={ctaHref}
          className="hidden rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 sm:block"
        >
          Free inspection
        </a>
      </div>
    </header>
  );
}
