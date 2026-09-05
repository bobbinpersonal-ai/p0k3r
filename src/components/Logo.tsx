// Wordmark + heart mark, replacing the old plain-text + neon-dot header logo.
// The heart nods to the brand name; the mark is solid and simple so it stays
// crisp at favicon size.

export default function Logo({
  name = "LoveMeAfter",
  className = "",
}: {
  name?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="#1A1815" />
        <path
          d="M24 35 C14.5 27.5 10 21.5 10 16.3 C10 11.6 13.7 8.2 18 8.2 C20.9 8.2 23.1 9.8 24 12.3 C24.9 9.8 27.1 8.2 30 8.2 C34.3 8.2 38 11.6 38 16.3 C38 21.5 33.5 27.5 24 35 Z"
          fill="#FFFDFB"
        />
      </svg>
      <span className="font-sans text-xl font-extrabold tracking-tight text-ink">{name}</span>
    </span>
  );
}
