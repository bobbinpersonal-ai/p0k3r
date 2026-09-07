import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTAG_ID = GOOGLE_ADS_ID || GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  // Keyword first, brand last: this is the line in a search result and in a
  // Marketplace ad preview, and "movers" is what anyone is actually scanning for.
  title: `Movers on demand, Bay Area to Sacramento | ${SITE_NAME}`,
  description:
    "See your price before you book, pick your arrival window, and know who's coming. " +
    "Movers and a truck for one couch or a whole house — Bay Area to Sacramento.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {GTAG_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
                ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}');` : ""}
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
