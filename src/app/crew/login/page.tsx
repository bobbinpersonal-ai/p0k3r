import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { COMPANY } from "@/lib/regions/brand";
import { crewFromCookies } from "@/lib/crewAuth";
import CrewLoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Crew sign in", robots: { index: false, follow: false } };

export default async function CrewLoginPage() {
  if (await crewFromCookies()) redirect("/crew");

  return (
    <div className="recruit min-h-screen">
      <main className="rc-terminal min-h-screen">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
            {COMPANY.name}
          </Link>
          <p className="rc-accent mt-8 font-mono text-xs uppercase tracking-[0.22em]">Crew</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Sign in</h1>
          <p className="mt-2 text-neutral-300">
            Your jobs, the price book, and the paperwork to close one at the table.
          </p>

          <CrewLoginForm />

          <p className="mt-10 border-t border-white/10 pt-6 text-sm text-neutral-400">
            No password yet? Open the link the office sent you — there&apos;s a button on it. Stuck,
            call{" "}
            <a href={`tel:${COMPANY.phone.replace(/[^\d+]/g, "")}`} className="rc-accent font-semibold">
              {COMPANY.phone}
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
