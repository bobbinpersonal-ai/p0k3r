// Flat "sticker" icons for the four yard services, in the same visual language
// as UseCaseIcons.tsx and FleetIcons.tsx.
//
// Green here rather than the brand coral: these are the only place on the site
// where the icon is standing in for a photograph, and a green lawn reads as a
// lawn instantly in a way a coral one doesn't. The surrounding chrome stays
// brand-colored, so the palette holds.

const LEAF = "#4A9A3F";
const LEAF_LIGHT = "#78C46A";
const SOIL = "#8B5E34";
const STEEL = "#9AA3AE";

/** Mow, edge & blow — a walk-behind mower on cut grass. */
export function MowerIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="4" y="48" width="56" height="10" rx="3" fill="url(#yardTurf)" />
      <path d="M20 46V26a5 5 0 0 1 5-5h4" stroke={STEEL} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="14" y="34" width="30" height="14" rx="4" fill="url(#yardMower)" />
      <rect x="44" y="38" width="12" height="10" rx="3" fill={STEEL} />
      <circle cx="21" cy="50" r="5" fill="#3A3F47" />
      <circle cx="41" cy="50" r="5" fill="#3A3F47" />
      <defs>
        <linearGradient id="yardMower" x1="14" y1="34" x2="44" y2="48">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
        <linearGradient id="yardTurf" x1="4" y1="48" x2="60" y2="58">
          <stop offset="0" stopColor={LEAF_LIGHT} />
          <stop offset="1" stopColor={LEAF} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Cleanup & overgrowth — a rake pulling a pile clear. */
export function RakeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <path d="M42 8 26 34" stroke={SOIL} strokeWidth="5" strokeLinecap="round" />
      <path d="M14 34h20" stroke={STEEL} strokeWidth="5" strokeLinecap="round" />
      <path d="M16 34v9M22 34v9M28 34v9M34 34v9" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
      <path
        d="M34 56c2-10 10-14 18-12s10 12 6 12Z"
        fill="url(#yardPile)"
      />
      <defs>
        <linearGradient id="yardPile" x1="34" y1="44" x2="60" y2="58">
          <stop offset="0" stopColor={LEAF_LIGHT} />
          <stop offset="1" stopColor="#C2760C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Trimming & hauling — shears on a hedge. */
export function ShearsIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="6" y="34" width="30" height="24" rx="6" fill="url(#yardHedge)" />
      <circle cx="52" cy="14" r="6" fill="none" stroke={STEEL} strokeWidth="4" />
      <circle cx="52" cy="34" r="6" fill="none" stroke={STEEL} strokeWidth="4" />
      <path d="M48 18 26 36M48 30 26 12" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
      <defs>
        <linearGradient id="yardHedge" x1="6" y1="34" x2="36" y2="58">
          <stop offset="0" stopColor={LEAF_LIGHT} />
          <stop offset="1" stopColor={LEAF} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Mulch, sod & planting — a young plant going into the ground. */
export function PlantIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="4" y="46" width="56" height="12" rx="4" fill={SOIL} />
      <path d="M32 46V26" stroke={LEAF} strokeWidth="4" strokeLinecap="round" />
      <path d="M32 32c-10 0-14-6-14-12 8 0 14 4 14 12Z" fill="url(#yardLeafA)" />
      <path d="M32 28c10 0 14-6 14-13-8 0-14 5-14 13Z" fill="url(#yardLeafB)" />
      <defs>
        <linearGradient id="yardLeafA" x1="18" y1="20" x2="32" y2="32">
          <stop offset="0" stopColor={LEAF_LIGHT} />
          <stop offset="1" stopColor={LEAF} />
        </linearGradient>
        <linearGradient id="yardLeafB" x1="32" y1="15" x2="46" y2="28">
          <stop offset="0" stopColor={LEAF} />
          <stop offset="1" stopColor={LEAF_LIGHT} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Looked up by service value, so a new service can't silently lose its icon. */
export const YARD_SERVICE_ICONS: Record<string, () => JSX.Element> = {
  MOW_EDGE_BLOW: MowerIcon,
  CLEANUP: RakeIcon,
  TRIM_HAUL: ShearsIcon,
  INSTALL: PlantIcon,
};
