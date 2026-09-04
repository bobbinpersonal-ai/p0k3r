const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Haul";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(555) 555-0100";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        <p>
          &copy; {new Date().getFullYear()} {SITE_NAME}. On-demand moving help, dispatched to local pros.
        </p>
        <p className="mt-1">
          Questions? Call or text{" "}
          <a href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`} className="font-medium text-brand">
            {SUPPORT_PHONE}
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
