// Stylized, low-poly outline of California marking our service territory.
// Coordinates are a rough hand-fit equirectangular projection (not survey
// accurate) chosen to read clearly at small sizes, matching the flat
// "sticker" style used by FleetIcons/HelperIcon.

const OUTLINE =
  "M27,20 L128,20 L128,164 L258,318 L255,465 L197,475 L166,409 L135,385 " +
  "L114,375 L97,322 L82,279 L80,261 L68,223 L56,212 L37,150 L27,78 Z";

type Marker = {
  label: string;
  x: number;
  y: number;
  labelDx: number;
  labelDy: number;
  anchor: "start" | "middle" | "end";
};

const MARKERS: Marker[] = [
  { label: "Bay Area", x: 78, y: 223, labelDx: -14, labelDy: 4, anchor: "end" },
  { label: "Sacramento / Davis", x: 89, y: 185, labelDx: 0, labelDy: -14, anchor: "middle" },
  { label: "Stockton", x: 97, y: 214, labelDx: 16, labelDy: 4, anchor: "start" },
  { label: "Merced", x: 116, y: 246, labelDx: 16, labelDy: 4, anchor: "start" },
  { label: "Salinas", x: 92, y: 275, labelDx: -14, labelDy: 4, anchor: "end" },
  { label: "Los Angeles", x: 170, y: 402, labelDx: 16, labelDy: 4, anchor: "start" },
];

export default function CaliforniaMap() {
  return (
    <svg viewBox="0 0 300 500" className="mx-auto h-full w-full max-w-xs" aria-hidden="true">
      <defs>
        <linearGradient id="caFill" x1="0" y1="0" x2="300" y2="500">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.16" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="caStroke" x1="0" y1="0" x2="300" y2="500">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id="markerGlow">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
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
        <g key={m.label}>
          <circle cx={m.x} cy={m.y} r="12" fill="url(#markerGlow)" />
          <circle cx={m.x} cy={m.y} r="4" fill="#22d3ee" />
          <circle cx={m.x} cy={m.y} r="4" fill="none" stroke="#05060a" strokeWidth="1.5" />
          <text
            x={m.x + m.labelDx}
            y={m.y + m.labelDy}
            textAnchor={m.anchor}
            className="fill-slate-200"
            style={{ font: "11px var(--font-mono), monospace" }}
          >
            {m.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
