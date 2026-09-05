// Simple flat "sticker" style vehicle icons in brand colors, animated with a
// gentle float via .animate-float (see globals.css). Meant as a lightweight
// stand-in for the KLING-generated animated versions (see README for the
// prompt) — swap the <svg> below for a <video>/<img> once those exist.
// All three face the same direction (right) so they read as one fleet.

function PickupIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <rect x="14" y="30" width="52" height="26" rx="4" fill="url(#pickupBed)" />
      <path
        d="M114,30 C114,23 108,18 101,18 L81,18 C75,18 70,21 67,27 L61,38 L114,38 Z"
        fill="url(#pickupCab)"
      />
      <rect x="88" y="24" width="16" height="10" rx="2" fill="#0d0f18" opacity="0.5" />
      <circle cx="32" cy="60" r="9" fill="#0d0f18" />
      <circle cx="32" cy="60" r="4" fill="#94a3b8" />
      <circle cx="92" cy="60" r="9" fill="#0d0f18" />
      <circle cx="92" cy="60" r="4" fill="#94a3b8" />
      <defs>
        <linearGradient id="pickupBed" x1="14" y1="30" x2="66" y2="56">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="pickupCab" x1="61" y1="18" x2="114" y2="38">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#22d3ee" />
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
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BoxTruckIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <rect x="4" y="16" width="72" height="40" rx="6" fill="url(#truckBody)" stroke="#05060a" strokeWidth="1.5" />
      <rect x="10" y="22" width="60" height="6" rx="3" fill="#ffffff" opacity="0.14" />
      <path d="M76 28h18l16 16v12H76V28z" fill="url(#truckCab)" stroke="#05060a" strokeWidth="1.5" />
      <path d="M90 32h9l10 10H90V32z" fill="#bff7ff" opacity="0.85" />
      <rect x="72" y="30" width="4" height="8" rx="1.5" fill="#0d0f18" />
      <circle cx="28" cy="60" r="10" fill="#0d0f18" />
      <circle cx="28" cy="60" r="4.5" fill="#cbd5e1" />
      <circle cx="94" cy="60" r="10" fill="#0d0f18" />
      <circle cx="94" cy="60" r="4.5" fill="#cbd5e1" />
      <defs>
        <linearGradient id="truckBody" x1="4" y1="16" x2="76" y2="56">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="truckCab" x1="76" y1="28" x2="110" y2="56">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0ea5c7" />
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
          className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-6"
        >
          <div className="animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
            <Icon />
          </div>
          <p className="font-mono text-xs text-slate-400">{label}</p>
          <p className="font-mono text-sm font-bold text-brand-cyan">{rate}</p>
        </div>
      ))}
    </div>
  );
}
