import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { loadEditableProducts } from "@/lib/texas/loadPriceBook";
import ProductsEditor from "./ProductsEditor";

export const metadata = { title: "Products & pricing", robots: { index: false, follow: false } };

export default async function ProductsPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const products = await loadEditableProducts();
  const unpriced = products.filter((p) => !p.edited).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · price book
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Products &amp; pricing</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-300">
        Everything a rep can put on an estimate. Add a product when you sign a supplier — it&apos;s
        a form, not a deploy. Saving publishes immediately.
      </p>

      {unpriced > 0 && (
        <p className="mt-4 rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-sm text-ink">
          <strong>{unpriced} product{unpriced === 1 ? "" : "s"} still on seed pricing.</strong>{" "}
          Those rates are placeholders this repo guessed at, not your supplier&apos;s. Open each one
          and put your real cost and base in before a rep quotes from it.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
        <Link href="/admin/tx/leads" className="text-neutral-300 underline">Texas leads</Link>
        <Link href="/admin/tx/paperwork" className="text-neutral-300 underline">Paperwork</Link>
        <Link href="/admin/dashboard" className="text-neutral-300 underline">Dispatch board</Link>
        <Link href="/admin/services" className="text-neutral-300 underline">California services</Link>
      </div>

      <ProductsEditor initial={products} />
    </main>
  );
}
