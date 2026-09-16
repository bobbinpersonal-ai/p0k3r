import { WHAT_WE_DO } from "@/lib/regions/brand";

// The strip of everything we do, sliding under the nav.
//
// Two things make this safe rather than the usual marquee that breaks a page.
// It sits in its own full-width band with overflow hidden, never inside a grid
// track — a `w-max` track inside a grid stretches the column to the width of
// the content and quietly blows the layout out on a phone. And the track is
// duplicated so the loop has no seam, with the copy hidden from screen readers
// so the list is announced once rather than twice.
//
// It stops entirely for anyone who has asked their system for less motion.

export default function TradeMarquee() {
  return (
    <div className="border-b border-white/10 bg-surface/60">
      <div className="relative flex overflow-hidden py-2.5">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 animate-marquee items-center gap-2 pr-2 motion-reduce:animate-none"
          >
            {WHAT_WE_DO.map((item) => (
              <li
                key={item}
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-neutral-200"
              >
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
