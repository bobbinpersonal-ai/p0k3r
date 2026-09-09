import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(424) 426-0760";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@lovemeafter.com";

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-500 sm:px-6">
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
          <Link href="/drive" className="font-medium text-brand-cyan">
            Work with us
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
      </div>
    </footer>
  );
}
