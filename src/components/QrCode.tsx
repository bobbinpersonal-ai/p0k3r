import { encode } from "@/lib/qr";

// Renders a QR as inline SVG, from modules to path, with no image request and
// no client JavaScript. Works in a server component (the printed sheet) and in
// a client one (the deposit step, where the amount is in the link), which is
// why it takes no hooks.
//
// One <path> of one-module squares rather than a <rect> each: a version-4 code
// is over a thousand dark modules, and a thousand elements is a page a printer
// thinks about.

export default function QrCode({
  value,
  className = "",
  label,
  quiet = 4,
}: {
  value: string;
  className?: string;
  /** What scanning it does, for anyone who can't see it. */
  label: string;
  quiet?: number;
}) {
  let encoded;
  try {
    encoded = encode(value);
  } catch {
    // Too long to encode. A missing code is recoverable — every screen that
    // shows one also shows the thing it points at in words — where a thrown
    // error takes the page with it.
    return null;
  }

  const { size, modules } = encoded;
  const total = size + quiet * 2;
  const path: string[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (modules[row][col]) path.push(`M${col + quiet} ${row + quiet}h1v1h-1z`);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className={className}
    >
      <rect width={total} height={total} fill="#fff" />
      <path fill="#000" d={path.join("")} />
    </svg>
  );
}
