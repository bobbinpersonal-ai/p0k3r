// Stylized, low-poly outline of California marking our service territory.
// Coordinates are a rough hand-fit equirectangular projection (not survey
// accurate) chosen to read clearly at small sizes, matching the flat
// "sticker" style used by FleetIcons/HelperIcon. Each marker links to its
// city's booking page.

const OUTLINE =
  "M27,20 L128,20 L128,164 L258,318 L255,465 L197,475 L166,409 L135,385 " +
  "L114,375 L97,322 L82,279 L80,261 L68,223 L56,212 L37,150 L27,78 Z";

type Marker = {
  slug: string;
  label: string;
  x: number;
  y: number;
  labelDx: number;
  labelDy: number;
  anchor: "start" | "middle" | "end";
};

const MARKERS: Marker[] = [
  { slug: "bay-area", label: "Bay Area", x: 78, y: 223, labelDx: -14, labelDy: 4, anchor: "end" },
  { slug: "sacramento", label: "Sacramento", x: 95, y: 180, labelDx: 0, labelDy: -10, anchor: "middle" },
  { slug: "davis", label: "Davis", x: 76, y: 192, labelDx: -12, labelDy: 4, anchor: "end" },
  { slug: "stockton", label: "Stockton", x: 97, y: 214, labelDx: 16, labelDy: 4, anchor: "start" },
  { slug: "merced", label: "Merced", x: 116, y: 246, labelDx: 16, labelDy: 4, anchor: "start" },
  { slug: "salinas", label: "Salinas", x: 92, y: 275, labelDx: -14, labelDy: 4, anchor: "end" },
  { slug: "los-angeles", label: "Los Angeles", x: 170, y: 402, labelDx: 16, labelDy: 4, anchor: "start" },
];

export default function CaliforniaMap() {
  return (
    <svg
      viewBox="0 0 300 500"
      className="mx-auto h-full w-full max-w-xs"
      role="img"
      aria-label="Map of California service cities — click a city to book"
    >
      <defs>
        <linearGradient id="caFill" x1="0" y1="0" x2="300" y2="500">
          <stop offset="0" stopColor="#F0455A" stopOpacity="0.16" />
          <stop offset="1" stopColor="#E08E1D" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="caStroke" x1="0" y1="0" x2="300" y2="500">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#E08E1D" />
        </linearGradient>
        <radialGradient id="markerGlow">
          <stop offset="0" stopColor="#E08E1D" stopOpacity="0.55" />
          <stop offset="1" stopColor="#E08E1D" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d={OUTLINE}
        fill="url(#caFill)"
        stroke="url(#caStroke)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {MARKERS.map((m) => (
        <a key={m.slug} href={`/movers/${m.slug}`} className="group cursor-pointer">
          <circle cx={m.x} cy={m.y} r="12" fill="url(#markerGlow)" />
          <circle
            cx={m.x}
            cy={m.y}
            r="4"
            className="fill-brand transition group-hover:fill-brand-dark"
          />
          <circle cx={m.x} cy={m.y} r="4" fill="none" stroke="#FFFDFB" strokeWidth="1.5" />
          <text
            x={m.x + m.labelDx}
            y={m.y + m.labelDy}
            textAnchor={m.anchor}
            className="fill-neutral-500 transition group-hover:fill-ink"
            style={{ font: "11px var(--font-mono), monospace" }}
          >
            {m.label}
          </text>
        </a>
      ))}
    </svg>
  );
}
