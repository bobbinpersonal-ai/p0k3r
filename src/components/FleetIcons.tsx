// Simple flat "sticker" style vehicle icons in brand colors, animated with a
// gentle float via .animate-float (see globals.css). Meant as a lightweight
// stand-in for the KLING-generated animated versions (see README for the
// prompt) — swap the <svg> below for a <video>/<img> once those exist.
// All three face the same direction (right) so they read as one fleet.

function PickupIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <rect x="6" y="40" width="4" height="16" rx="1" fill="#C22C40" />
      <rect x="8" y="36" width="50" height="20" rx="3" fill="url(#pickupBed)" />
      <rect x="8" y="36" width="50" height="5" rx="2" fill="#ffffff" opacity="0.15" />
      <path
        d="M52,56 L52,28 Q52,18 62,18 L80,18 Q88,18 92,25 L100,34 L108,34 L108,56 Z"
        fill="url(#pickupCab)"
      />
      <rect x="60" y="21" width="20" height="7" rx="2" fill="#7dd3fc" opacity="0.7" />
      <circle cx="104" cy="30" r="2.5" fill="#fef08a" />
      <circle cx="32" cy="60" r="9" fill="#0d0f18" />
      <circle cx="32" cy="60" r="4" fill="#94a3b8" />
      <circle cx="92" cy="60" r="9" fill="#0d0f18" />
      <circle cx="92" cy="60" r="4" fill="#94a3b8" />
      <defs>
        <linearGradient id="pickupBed" x1="8" y1="36" x2="58" y2="56">
          <stop offset="0" stopColor="#F0455A" />
          <stop offset="1" stopColor="#C22C40" />
        </linearGradient>
        <linearGradient id="pickupCab" x1="52" y1="18" x2="108" y2="56">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#E08E1D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SprinterIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <path d="M6 34c0-8 6-14 14-14h64c9 0 16 5 20 13l6 11v14H6V34z" fill="url(#vanBody)" />
      <rect x="70" y="26" width="18" height="14" rx="3" fill="#0d0f18" opacity="0.5" />
      <circle cx="32" cy="60" r="9" fill="#0d0f18" />
      <circle cx="32" cy="60" r="4" fill="#94a3b8" />
      <circle cx="92" cy="60" r="9" fill="#0d0f18" />
      <circle cx="92" cy="60" r="4" fill="#94a3b8" />
      <defs>
        <linearGradient id="vanBody" x1="6" y1="20" x2="110" y2="58">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BoxTruckIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <rect x="4" y="16" width="72" height="40" rx="6" fill="url(#truckBody)" stroke="#FFFDFB" strokeWidth="1.5" />
      <rect x="10" y="22" width="60" height="6" rx="3" fill="#ffffff" opacity="0.14" />
      <path d="M76 28h18l16 16v12H76V28z" fill="url(#truckCab)" stroke="#FFFDFB" strokeWidth="1.5" />
      <path d="M90 32h9l10 10H90V32z" fill="#7dd3fc" opacity="0.85" />
      <rect x="72" y="30" width="4" height="8" rx="1.5" fill="#0d0f18" />
      <circle cx="28" cy="60" r="10" fill="#0d0f18" />
      <circle cx="28" cy="60" r="4.5" fill="#cbd5e1" />
      <circle cx="94" cy="60" r="10" fill="#0d0f18" />
      <circle cx="94" cy="60" r="4.5" fill="#cbd5e1" />
      <defs>
        <linearGradient id="truckBody" x1="4" y1="16" x2="76" y2="56">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#C22C40" />
        </linearGradient>
        <linearGradient id="truckCab" x1="76" y1="28" x2="110" y2="56">
          <stop offset="0" stopColor="#E08E1D" />
          <stop offset="1" stopColor="#9C5B0A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const FLEET = [
  { Icon: PickupIcon, label: "Pickup truck", rate: "$25/hr" },
  { Icon: SprinterIcon, label: "Sprinter van", rate: "$28/hr" },
  { Icon: BoxTruckIcon, label: "Box truck", rate: "$32/hr" },
];

export default function FleetIcons() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {FLEET.map(({ Icon, label, rate }, i) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-black/[0.03] py-6"
        >
          <div className="animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
            <Icon />
          </div>
          <p className="font-mono text-xs text-neutral-500">{label}</p>
          <p className="font-mono text-sm font-bold text-brand-cyan">{rate}</p>
        </div>
      ))}
    </div>
  );
}
