import Image from "next/image";
import { REVEAL_DISTANCE_MILES, type CrewMatch } from "@/lib/crew";

// The "here's your mover" card — the delivery-app moment where a real face and
// a real truck show up before you've handed over anything.
//
// Worth being careful with the wording: dispatch assigns the actual crew after
// the booking comes in, so this says who'd likely take the job rather than
// promising this specific person. Overstating it would be the kind of thing a
// customer remembers when someone else pulls up — and match.confident exists
// for exactly that reason. Ads are going to send bookings from places nobody
// on a five-person roster lives near, and the honest answer there is "here's
// the closest person we've got," not a copy-pasted "likely your mover" that
// implies someone forty minutes away when it's actually four hours.
//
// Past REVEAL_DISTANCE_MILES, this also stops saying which specific number or
// which town: "308 mi away" and "based in Manteca" on a booking that's
// genuinely 300 miles out reads less like reassurance and more like "wait, is
// anyone actually coming?" The card stays honest about the *kind* of match
// (see `eyebrow`/`closingLine` below, still driven by `confident`) — it just
// stops putting a number or a place name on it once doing so would work
// against the point of showing a name at all.

/** Used in place of the roster note (which usually names a territory) once
 *  the job is far enough out that naming the territory would be the same
 *  problem in a different field. */
const GEOGRAPHY_FREE_NOTE: Record<CrewMatch["role"], string> = {
  driver: "Part of the LoveMeAfter driver roster",
  helper: "Part of the LoveMeAfter crew",
};

export default function CrewMatchCard({
  match,
  vehicleLabel,
  trade = "moving",
}: {
  match: CrewMatch;
  vehicleLabel?: string;
  /**
   * Which of the businesses this job belongs to.
   *
   * A move splits the crew into a driver and a helper, because the vehicle is
   * half the job. A yard job doesn't: the same six people mow, edge and haul,
   * and there's no truck to be "riding along" in. So the driver/helper wording
   * below is a moving-side distinction, and landscaping opts out of it rather
   * than picking one of the two words and being wrong half the time.
   */
  trade?: "moving" | "yard";
}) {
  const { member, role, milesAway, confident } = match;
  // Roster names are stored as "First L." — the sentence below reads better
  // with just the first name.
  const firstName = member.name.split(" ")[0];

  const revealDistance = milesAway !== null && milesAway <= REVEAL_DISTANCE_MILES;

  // Everyone on the roster works both ways, so say which one this is rather
  // than implying they're driving a truck they don't own.
  const detail =
    trade === "yard"
      ? member.vehicle ?? ""
      : role === "driver"
        ? [member.vehicle, vehicleLabel].filter(Boolean).join(" · ")
        : "Riding along as your second pair of hands";

  const eyebrow = !confident
    ? "Closest available crew"
    : trade === "yard" || role !== "driver"
      ? "Likely on your crew"
      : "Likely your mover";

  // Most roster notes name a territory ("Manteca and Stockton"), which is
  // exactly the kind of thing being hidden below — showing it here would
  // undo that.
  const noteText = revealDistance
    ? (trade === "yard" && member.yardNote) || member.note
    : trade === "yard"
      ? "Part of the LoveMeAfter crew"
      : GEOGRAPHY_FREE_NOTE[role];

  const jobNoun = trade === "yard" ? "visit" : "move";
  const closingLine =
    confident || milesAway === null
      ? `A dispatcher confirms your actual crew when they call — if ${firstName} is already on a job, someone else from the roster takes it.`
      : `A dispatcher will confirm who's covering your ${jobNoun} before anything's booked.`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">{eyebrow}</p>
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
          <p className="text-sm text-neutral-300">{noteText}</p>
          <p className="mt-1 font-mono text-xs text-neutral-300">
            {[detail, revealDistance ? `based in ${member.homeBase}` : null]
              .filter(Boolean)
              .join(" · ")}
            {revealDistance && milesAway !== null && milesAway > 1 &&
              ` · ${Math.round(milesAway)} mi away`}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-neutral-300">{closingLine}</p>
    </div>
  );
}
