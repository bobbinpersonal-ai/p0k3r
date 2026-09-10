import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import KnockForm from "./KnockForm";

export const metadata = {
  title: "Door knock intake",
  robots: { index: false, follow: false },
};

export default function KnockPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · door knock
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        Book it on the step
      </h1>
      <p className="mt-2 text-sm text-neutral-300">
        One screen, priced as you tap. Everything books as an ordinary job tagged{" "}
        <span className="font-mono text-brand-cyan">door-knock</span>, so the dispatch board
        shows what the street was worth.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
        <Link href="/admin/knock/sheet" className="text-brand-cyan underline">
          Print the price sheet
        </Link>
        <Link href="/admin/dashboard" className="text-neutral-300 underline">
          Dispatch board
        </Link>
      </div>
      <KnockForm />
    </main>
  );
}
