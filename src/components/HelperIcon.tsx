// Simple flat "sticker" style helper icon, matching the vehicle icons in
// FleetIcons.tsx. Meant as a lightweight stand-in until a KLING-generated
// animated version exists.

function HelperFigure() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <path d="M22 78C22 58 40 50 60 50C80 50 98 58 98 78Z" fill="url(#helperShirt)" />
      <circle cx="60" cy="40" r="18" fill="url(#helperSkin)" />
      <circle cx="48" cy="45" r="3" fill="#fb7185" opacity="0.45" />
      <circle cx="72" cy="45" r="3" fill="#fb7185" opacity="0.45" />
      <circle cx="52" cy="40" r="2.5" fill="#0d0f18" />
      <circle cx="68" cy="40" r="2.5" fill="#0d0f18" />
      <path
        d="M50 47c4 4 16 4 20 0"
        stroke="#0d0f18"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M36 32Q60 6 84 32Z" fill="url(#helperCap)" />
      <ellipse cx="72" cy="31" rx="28" ry="5" fill="url(#helperCap)" />
      <defs>
        <linearGradient id="helperShirt" x1="22" y1="50" x2="98" y2="78">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="helperSkin" x1="42" y1="22" x2="78" y2="58">
          <stop offset="0" stopColor="#fbbf78" />
          <stop offset="1" stopColor="#f2994a" />
        </linearGradient>
        <linearGradient id="helperCap" x1="36" y1="6" x2="84" y2="32">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#0ea5c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function HelperIcon() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-6 px-8">
      <div className="animate-float">
        <HelperFigure />
      </div>
      <p className="font-mono text-xs text-slate-400">Helper</p>
    </div>
  );
}
