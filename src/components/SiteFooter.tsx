import Link from "next/link";
import { EXEMPTION_LIMIT } from "@/lib/landscaping";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@lovemeafter.com";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-300 sm:px-6">
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}. Landscaping, moving and hauling —
          Bay Area to Sacramento.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/yard" className="font-medium text-brand-cyan">
            Yard service
          </Link>
          <Link href="/moving" className="font-medium text-brand-cyan">
            Moving
          </Link>
          <Link href="/junk-removal" className="font-medium text-brand-cyan">
            Junk removal
          </Link>
          <Link href="/contractors" className="font-medium text-brand-cyan">
            Licensed contractors
          </Link>
          <Link href="/drive" className="font-medium text-brand-cyan">
            Yard crew jobs
          </Link>
          <Link href="/drive/moving" className="font-medium text-brand-cyan">
            Moving crew jobs
          </Link>
        </p>
        <p className="mt-1">
          Questions? Call or text{" "}
          <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`} className="font-medium text-brand-cyan">
            {SUPPORT_PHONE}
          </a>{" "}
          or email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-brand-cyan">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        {/* Required, not decorative. California B&P 7027.2 means advertising
            work under the minor-work exemption has to say the advertiser is
            unlicensed, and 7048 is the exemption itself. Muted rather than
            hidden: it should read as a plain statement of what this company is,
            legible on every page, without competing with the content above it. */}
        <p className="mt-6 max-w-4xl border-t border-white/5 pt-6 text-xs leading-relaxed text-neutral-400">
          <span className="font-semibold text-neutral-300">Disclaimer:</span> {SITE_NAME}{" "}
          provides minor home maintenance, yard care, and cosmetic assembly services under
          the ${EXEMPTION_LIMIT.toLocaleString()} threshold permitted by California law.{" "}
          {SITE_NAME} is not a licensed general contractor. Any project exceeding $
          {EXEMPTION_LIMIT.toLocaleString()} or requiring building permits, electrical,
          plumbing, or structural work is referred directly to fully independent, licensed,
          bonded, and insured California state contractors (CSLB).
        </p>
      </div>
    </footer>
  );
}
