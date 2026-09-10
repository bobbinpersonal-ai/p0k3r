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

/** Exterior & driveway refresh — a pressure washer fanning onto paving. */
export function WashIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="4" y="46" width="56" height="12" rx="3" fill="#B9C0C8" />
      <path d="M30 46c0-8 8-14 22-16v16Z" fill="url(#yardSpray)" opacity="0.85" />
      <rect x="10" y="24" width="18" height="10" rx="3" fill="url(#yardWasher)" />
      <path d="M28 29h8" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
      <path d="M14 34v10" stroke={STEEL} strokeWidth="4" strokeLinecap="round" />
      <defs>
        <linearGradient id="yardWasher" x1="10" y1="24" x2="28" y2="34">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
        <linearGradient id="yardSpray" x1="30" y1="30" x2="52" y2="46">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Yard assembly & minor repairs — a wrench over a screwdriver. */
export function ToolsIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <path d="M44 10l10 10-22 22-10-10Z" fill={STEEL} opacity="0.85" />
      <circle cx="49" cy="15" r="3.5" fill={SOIL} />
      <path
        d="M20 10a11 11 0 0 0 13 14l17 17-6 6-17-17A11 11 0 0 1 13 17l7 7 6-6-6-8Z"
        fill="url(#yardWrench)"
      />
      <defs>
        <linearGradient id="yardWrench" x1="13" y1="10" x2="50" y2="47">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#C2760C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Looked up by service value, so a new service can't silently lose its icon.
 *
 * The retired values are kept alongside the current ones: bookings taken before
 * the catalogue changed still carry them, and a historical job rendered
 * anywhere should get its icon rather than a gap.
 */
export const YARD_SERVICE_ICONS: Record<string, () => JSX.Element> = {
  EXTERIOR_WASH: WashIcon,
  CLEAN_EDGE: MowerIcon,
  ASSEMBLY_REPAIR: ToolsIcon,
  TREE_SHRUB_CARE: ShearsIcon,

  MOW_EDGE_BLOW: MowerIcon,
  CLEANUP: RakeIcon,
  TRIM_HAUL: ShearsIcon,
  INSTALL: PlantIcon,
};

/**
 * An icon for any service, including ones invented at /admin/services.
 *
 * A custom service has no entry here and never will, so it gets the generic
 * one rather than a hole in the card — the alternative is a row of services
 * where the new one is visibly second-class.
 */
export function serviceIcon(value: string): () => JSX.Element {
  return YARD_SERVICE_ICONS[value] ?? PlantIcon;
}
