// Simple flat "sticker" style vehicle icons in brand colors, animated with a
// gentle float via .animate-float (see globals.css). Meant as a lightweight
// stand-in for the KLING-generated animated versions (see README for the
// prompt) — swap the <svg> below for a <video>/<img> once those exist.

function BoxTruckIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <rect x="6" y="18" width="70" height="38" rx="6" fill="url(#truckBody)" />
      <path d="M76 30h20l14 14v12H76V30z" fill="url(#truckCab)" />
      <rect x="90" y="34" width="14" height="10" rx="2" fill="#0d0f18" opacity="0.5" />
      <circle cx="30" cy="60" r="9" fill="#0d0f18" />
      <circle cx="30" cy="60" r="4" fill="#94a3b8" />
      <circle cx="92" cy="60" r="9" fill="#0d0f18" />
      <circle cx="92" cy="60" r="4" fill="#94a3b8" />
      <defs>
        <linearGradient id="truckBody" x1="6" y1="18" x2="76" y2="56">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="truckCab" x1="76" y1="30" x2="110" y2="56">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0ea5c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function VanIcon() {
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

function PickupIcon() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <rect x="54" y="30" width="52" height="26" rx="4" fill="url(#pickupBed)" />
      <path d="M6 30c0-7 6-12 13-12h20c6 0 11 3 14 9l6 11H6V30z" fill="url(#pickupCab)" />
      <rect x="16" y="24" width="16" height="10" rx="2" fill="#0d0f18" opacity="0.5" />
      <circle cx="28" cy="60" r="9" fill="#0d0f18" />
      <circle cx="28" cy="60" r="4" fill="#94a3b8" />
      <circle cx="88" cy="60" r="9" fill="#0d0f18" />
      <circle cx="88" cy="60" r="4" fill="#94a3b8" />
      <defs>
        <linearGradient id="pickupBed" x1="54" y1="30" x2="106" y2="56">
          <stop offset="0" stopColor="#4338ca" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="pickupCab" x1="6" y1="18" x2="59" y2="38">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const FLEET = [
  { Icon: BoxTruckIcon, label: "Box truck" },
  { Icon: VanIcon, label: "Cargo van" },
  { Icon: PickupIcon, label: "Pickup truck" },
];

export default function FleetIcons() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {FLEET.map(({ Icon, label }, i) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-6"
        >
          <div className="animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
            <Icon />
          </div>
          <p className="font-mono text-xs text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
