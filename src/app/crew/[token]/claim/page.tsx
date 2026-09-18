import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/regions/brand";
import CrewClaimForm from "./ClaimForm";

export const metadata = { title: "Set a password", robots: { index: false, follow: false } };

export default async function CrewClaimPage({ params }: { params: { token: string } }) {
  const crew = await prisma.worker.findUnique({
    where: { portalToken: params.token },
    select: { name: true, passwordHash: true, status: true },
  });
  if (!crew || crew.status === "INACTIVE") notFound();
  if (crew.passwordHash) redirect("/crew/login");

  return (
    <div className="recruit min-h-screen">
      <main className="rc-terminal min-h-screen">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <p className="text-lg font-extrabold tracking-tight text-ink">{COMPANY.name}</p>
          <p className="rc-accent mt-8 font-mono text-xs uppercase tracking-[0.22em]">Crew</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Set a password</h1>
          <p className="mt-2 text-neutral-300">
            So {crew.name} can get to your jobs and write estimates from any phone.
          </p>
          <CrewClaimForm token={params.token} name={crew.name} />
        </div>
      </main>
    </div>
  );
}
