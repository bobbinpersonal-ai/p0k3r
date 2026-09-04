import type { Metadata } from "next";
import "./globals.css";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Haul";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Movers on demand`,
  description: `Book a truck and a crew in minutes. ${SITE_NAME} dispatches local movers for apartments, houses, and single-item moves.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
