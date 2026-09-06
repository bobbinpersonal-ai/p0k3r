import Image from "next/image";
import type { CrewMember } from "@/lib/crew";

// The "here's your mover" card — the delivery-app moment where a real face
// and a real truck show up before you've handed over anything.
//
// Worth being careful with the wording: dispatch assigns the actual crew after
// the booking comes in, so this says who'd likely take the job rather than
// promising this specific person. Overstating it would be the kind of thing a
// customer remembers when someone else pulls up.

export default function CrewMatchCard({
  member,
  vehicleLabel,
}: {
  member: CrewMember;
  vehicleLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Likely your mover
      </p>
      <div className="mt-3 flex items-center gap-4">
        {/* Rounded square rather than a circle: a circular mask crops the
            edges of the frame, and these photos have more than a face in
            them worth keeping. */}
        <Image
          src={member.photo}
          alt={member.name}
          width={80}
          height={80}
          className="h-20 w-20 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink">{member.name}</p>
          <p className="text-sm text-neutral-500">{member.note}</p>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            {member.vehicle}
            {vehicleLabel ? ` · ${vehicleLabel}` : ""} · based in {member.homeBase}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-neutral-500">
        A dispatcher confirms your actual crew when they call — if Bobbin&apos;s already on a
        job, someone else from the roster takes it.
      </p>
    </div>
  );
}
