// Simple flat "sticker" style helper icon, matching the vehicle icons in
// FleetIcons.tsx. Faceless by design (same convention as the AI-gen photo
// assets — see README) so it reads as a professional icon, not a character.

function HelperFigure() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24" aria-hidden="true">
      <path d="M22 78C22 58 40 50 60 50C80 50 98 58 98 78Z" fill="url(#helperShirt)" />
      <circle cx="60" cy="40" r="18" fill="url(#helperHead)" />
      <path d="M36 32Q60 6 84 32Z" fill="url(#helperCap)" />
      <ellipse cx="72" cy="31" rx="28" ry="5" fill="url(#helperCap)" />
      <defs>
        <linearGradient id="helperShirt" x1="22" y1="50" x2="98" y2="78">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="helperHead" x1="42" y1="22" x2="78" y2="58">
          <stop offset="0" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#64748b" />
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
      <p className="font-mono text-sm font-bold text-brand-cyan">$19/hr</p>
      <p className="font-mono text-[10px] text-slate-500">+ keep all tips</p>
    </div>
  );
}
