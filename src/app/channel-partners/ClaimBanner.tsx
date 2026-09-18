import Link from "next/link";

// Shown above the portal to a partner who is still arriving on the texted link.
//
// Deliberately an invitation rather than a wall. Somebody who signed up on a
// cold call four minutes ago should be able to look around before we ask them
// to create anything — but they should also never have to hunt for the link
// again, and right now losing that text means losing the portal.

export default function ClaimBanner({ token }: { token: string }) {
  return (
    <div className="border-b border-brand-cyan/30 bg-brand-cyan/10">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-ink">
          <span className="font-bold">You&apos;re on your text link.</span>{" "}
          <span className="text-neutral-300">
            Set a password and you can get back in from anywhere, without hunting for it.
          </span>
        </p>
        <Link
          href={`/channel-partners/${token}/claim`}
          className="shrink-0 rounded-lg border border-brand-cyan/60 bg-brand-cyan/15 px-4 py-2 text-center text-sm font-bold text-brand-cyan hover:border-brand-cyan"
        >
          Set a password
        </Link>
      </div>
    </div>
  );
}
