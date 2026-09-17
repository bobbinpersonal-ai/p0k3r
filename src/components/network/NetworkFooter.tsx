import Link from "next/link";
import { ALL_CITIES, COMPANY, PHONE_DIGITS, REGIONS } from "@/lib/regions/brand";
import { LICENSED_TRADE_LINE } from "@/lib/regions/compliance";

export default function NetworkFooter() {
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
          <Link href="/partners" className="text-sm text-neutral-300 hover:text-ink">
            Contractor partners
          </Link>
          <Link href="/channel-partners" className="text-sm text-neutral-300 hover:text-ink">
            Channel partners
          </Link>
        </div>

        {/* Named towns and counties, by state. Most of the local search this
            site will ever do, and a homeowner scanning for their own town is
            the other half of why it's here. Counties matter more than usual
            here: a lot of this work is outside any city's jurisdiction. */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {REGIONS.map((region) => (
            <div key={region.code}>
              <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
                {region.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {region.markets.flatMap((m) => m.cities).slice(0, 10).join(" · ")}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {region.markets
                  .flatMap((m) => m.counties ?? [])
                  .slice(0, 6)
                  .map((c) => `${c} County`)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-neutral-400">
          &copy; {new Date().getFullYear()} {COMPANY.legalName}. Roofing, siding, fencing,
          gutters and exterior paint across {REGIONS.length} states and {ALL_CITIES.length}{" "}
          communities.
        </p>

        <p className="mt-4 max-w-4xl border-t border-white/5 pt-4 text-xs leading-relaxed text-neutral-400">
          Every crew we send carries its own general liability insurance and holds whatever
          licence or registration its state, city or county requires — including Attorney
          General roofing registration in Kansas, and local licensing across the Colorado Front
          Range. We verify those before a crew is dispatched and we re-check them.
        </p>
        <p className="mt-3 max-w-4xl text-xs leading-relaxed text-neutral-400">
          {LICENSED_TRADE_LINE}
        </p>
      </div>
    </footer>
  );
}
