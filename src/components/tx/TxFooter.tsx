import Link from "next/link";
import { ALL_CITIES, COMPANY, MARKETS, PHONE_DIGITS } from "@/lib/texas/brand";
import { LICENSED_TRADE_LINE } from "@/lib/texas/compliance";

export default function TxFooter() {
  return (
    <footer className="border-t border-white/10 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="text-lg font-extrabold text-ink">{COMPANY.name}</span>
          <a href={`tel:${PHONE_DIGITS}`} className="font-mono font-semibold text-brand-cyan">
            {COMPANY.phone}
          </a>
          <a href={`mailto:${COMPANY.email}`} className="text-sm text-neutral-300">
            {COMPANY.email}
          </a>
          <Link href="/sell" className="text-sm text-neutral-300 hover:text-ink">
            Sales careers
          </Link>
          <Link href="/crew" className="text-sm text-neutral-300 hover:text-ink">
            Crews &amp; installers
          </Link>
        </div>

        {/* Named cities, not "the greater metroplex". This list is most of the
            local search this site will ever do, and a homeowner scanning for
            their own town is the other half of why it's here. */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETS.map((market) => (
            <div key={market.slug}>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                {market.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {market.cities.join(" · ")}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-neutral-400">
          &copy; {new Date().getFullYear()} {COMPANY.legalName}. Roofing, siding, windows,
          gutters, fence and exterior paint across {ALL_CITIES.length} Texas cities.
        </p>
        <p className="mt-3 max-w-4xl border-t border-white/5 pt-4 text-xs leading-relaxed text-neutral-400">
          {LICENSED_TRADE_LINE}
        </p>
      </div>
    </footer>
  );
}
