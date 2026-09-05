// Small flat "sticker" icons for the "what people book us for" cards, in the
// same visual language as FleetIcons.tsx — one per use case so the carousel
// reads as a set of tiles instead of a wall of text.

export function BoxIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="10" y="16" width="44" height="38" rx="4" fill="url(#useBox)" />
      <rect x="10" y="16" width="44" height="8" fill="#ffffff" opacity="0.15" />
      <line x1="32" y1="16" x2="32" y2="54" stroke="#0d0f18" strokeOpacity="0.35" strokeWidth="3" />
      <line x1="10" y1="33" x2="54" y2="33" stroke="#0d0f18" strokeOpacity="0.35" strokeWidth="3" />
      <defs>
        <linearGradient id="useBox" x1="10" y1="16" x2="54" y2="54">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CouchIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="8" y="16" width="48" height="14" rx="6" fill="url(#useCouch)" />
      <rect x="8" y="26" width="48" height="16" rx="6" fill="url(#useCouch)" />
      <rect x="6" y="34" width="10" height="18" rx="4" fill="url(#useCouch)" />
      <rect x="48" y="34" width="10" height="18" rx="4" fill="url(#useCouch)" />
      <rect x="14" y="48" width="6" height="8" rx="2" fill="#0d0f18" opacity="0.6" />
      <rect x="44" y="48" width="6" height="8" rx="2" fill="#0d0f18" opacity="0.6" />
      <defs>
        <linearGradient id="useCouch" x1="6" y1="16" x2="58" y2="52">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#E08E1D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BuildingIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="14" y="8" width="36" height="48" rx="3" fill="url(#useBuilding)" />
      <rect x="20" y="14" width="8" height="8" fill="#7dd3fc" opacity="0.6" />
      <rect x="36" y="14" width="8" height="8" fill="#7dd3fc" opacity="0.6" />
      <rect x="20" y="28" width="8" height="8" fill="#7dd3fc" opacity="0.6" />
      <rect x="36" y="28" width="8" height="8" fill="#7dd3fc" opacity="0.6" />
      <rect x="26" y="44" width="12" height="12" fill="#0d0f18" opacity="0.5" />
      <defs>
        <linearGradient id="useBuilding" x1="14" y1="8" x2="50" y2="56">
          <stop offset="0" stopColor="#F0455A" />
          <stop offset="1" stopColor="#C22C40" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StorageIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="8" y="18" width="48" height="36" rx="3" fill="url(#useStorage)" />
      <line x1="8" y1="27" x2="56" y2="27" stroke="#0d0f18" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="8" y1="36" x2="56" y2="36" stroke="#0d0f18" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="8" y1="45" x2="56" y2="45" stroke="#0d0f18" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="32" cy="40" r="2.5" fill="#0d0f18" opacity="0.6" />
      <defs>
        <linearGradient id="useStorage" x1="8" y1="18" x2="56" y2="54">
          <stop offset="0" stopColor="#E08E1D" />
          <stop offset="1" stopColor="#9C5B0A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <path
        d="M24 18 Q24 12 32 12 Q40 12 40 18"
        fill="none"
        stroke="#FF8A93"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="10" y="18" width="44" height="32" rx="4" fill="url(#useBriefcase)" />
      <rect x="26" y="30" width="12" height="8" rx="2" fill="#0d0f18" opacity="0.5" />
      <defs>
        <linearGradient id="useBriefcase" x1="10" y1="18" x2="54" y2="50">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <path
        d="M32 50 C14 38 10 26 18 18 C24 12 32 16 32 22 C32 16 40 12 46 18 C54 26 50 38 32 50 Z"
        fill="url(#useHeart)"
      />
      <defs>
        <linearGradient id="useHeart" x1="10" y1="12" x2="54" y2="50">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#E08E1D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HaulIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="10" y="30" width="30" height="22" rx="3" fill="url(#useHaul)" />
      <rect x="10" y="30" width="30" height="6" fill="#ffffff" opacity="0.15" />
      <path
        d="M38 26 L54 12 M54 12 L54 22 M54 12 L44 12"
        stroke="url(#useHaul)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id="useHaul" x1="10" y1="12" x2="54" y2="52">
          <stop offset="0" stopColor="#E08E1D" />
          <stop offset="1" stopColor="#9C5B0A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HouseIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <path
        d="M8 32 L32 12 L56 32"
        fill="none"
        stroke="#FF8A93"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="14" y="26" width="36" height="28" rx="2" fill="url(#useHouse)" />
      <rect x="36" y="38" width="14" height="16" rx="2" fill="#1e293b" />
      <defs>
        <linearGradient id="useHouse" x1="14" y1="26" x2="50" y2="54">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#E08E1D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <path d="M34 6 L14 36 L28 36 L22 58 L50 26 L34 26 Z" fill="url(#useBolt)" />
      <defs>
        <linearGradient id="useBolt" x1="14" y1="6" x2="50" y2="58">
          <stop offset="0" stopColor="#E08E1D" />
          <stop offset="1" stopColor="#9C5B0A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TVIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="8" y="12" width="48" height="30" rx="3" fill="url(#useTV)" />
      <rect x="12" y="16" width="40" height="22" rx="2" fill="#7dd3fc" opacity="0.5" />
      <rect x="26" y="42" width="12" height="6" fill="#475569" />
      <rect x="18" y="48" width="28" height="4" rx="2" fill="#475569" />
      <defs>
        <linearGradient id="useTV" x1="8" y1="12" x2="56" y2="42">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BikeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <circle cx="16" cy="46" r="10" fill="none" stroke="#E08E1D" strokeWidth="3" />
      <circle cx="48" cy="46" r="10" fill="none" stroke="#E08E1D" strokeWidth="3" />
      <path
        d="M16 46 L28 24 L40 24 M28 24 L22 46 M40 24 L48 46 M40 24 L34 14"
        stroke="#E08E1D"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="34" cy="14" r="3" fill="#E08E1D" />
    </svg>
  );
}

export function DollyIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden="true">
      <rect x="24" y="12" width="26" height="30" rx="3" fill="url(#useDolly)" />
      <rect x="24" y="12" width="26" height="7" fill="#ffffff" opacity="0.15" />
      <line x1="16" y1="46" x2="16" y2="14" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <rect x="12" y="46" width="30" height="6" rx="2" fill="#94a3b8" />
      <circle cx="18" cy="56" r="6" fill="#334155" />
      <circle cx="18" cy="56" r="2.5" fill="#cbd5e1" />
      <circle cx="38" cy="56" r="6" fill="#334155" />
      <circle cx="38" cy="56" r="2.5" fill="#cbd5e1" />
      <defs>
        <linearGradient id="useDolly" x1="24" y1="12" x2="50" y2="42">
          <stop offset="0" stopColor="#FF8A93" />
          <stop offset="1" stopColor="#F0455A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
