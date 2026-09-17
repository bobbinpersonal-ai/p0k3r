// The list-partner program: a home service business hands over its existing
// customer list instead of doing any labor, and gets paid a flat fee every
// time a job sells off it.
//
// This is a different shape from the crew partners in src/lib/regions/states.ts
// or the appointment-referral contractors in referralAgreement.ts. Both of
// those get paid for work — a labor rate or a percentage of a job they
// closed. A channel partner does neither. What they're actually selling is
// the trust their own customers already have in them, which is why the call
// works as "a service check-in from {Partner}" rather than a cold call.
//
// That framing is also the compliance question that matters here: riding a
// partner's own established relationship with their customer is the reason
// this kind of call is safer than a cold list, but it only works if the call
// is truthful about who's calling and why, and if the partner actually had
// the right to hand that list over in the first place. See docs/regions.md.
//
// The deal has two halves. Half the gross profit on every job sold above the
// price-book threshold, which scales with the job and so is always affordable,
// plus a flat bonus on jobs big enough to carry one — a number to say on a
// cold call that does not need a spreadsheet to explain. Paid only once the
// job is complete, not at signing: a signed job that cancels or never finishes
// has produced nothing to share.
//
// One known sharp edge, left in deliberately because the alternative is an
// offer nobody can say out loud. The bonus is a cliff, not a ramp, so a job
// sold at the minimum earns the company less than one sold a dollar under it,
// and it takes roughly another $10,000 of contract value to climb back. Reps
// are paid on overage and so push upward anyway, which keeps the dead zone
// theoretical, but it is real and it is here rather than in a spreadsheet
// nobody reads.

/**
 * The bonus, in cents, on a job big enough to carry it.
 *
 * Conditional rather than universal, and that condition is the whole reason
 * this file is shaped the way it is. A flat fee is a fixed cost; a profit
 * split is a variable one. Stack a fixed cost on top of a variable one with no
 * floor under it and small jobs go underwater — at a 50% split the company
 * keeps half the gross profit less the fee, which is negative on anything under
 * twice the fee. So the bonus only attaches to jobs that can pay for it.
 */
export const CHANNEL_PARTNER_FEE_CENTS = 200_000;

/**
 * The partner's share of gross profit on a job sold above the threshold.
 *
 * "Gross profit" is the one from src/lib/regions/commission.ts — sold price
 * less job cost less what the rep earned — so this can never collide with rep
 * comp the way a share of the raw overage would. The rep is paid first and the
 * partner splits what is actually left.
 */
export const CHANNEL_PARTNER_PROFIT_SHARE = 0.5;

/**
 * Contract value at which the bonus starts applying.
 *
 * Stated as a contract value rather than as gross profit because it is a
 * number a partner can check against their own job. Gross profit is ours and
 * they cannot see it; "over $20,000" is a promise they can hold us to.
 */
export const CHANNEL_PARTNER_BONUS_MIN_CONTRACT_CENTS = 2_000_000;

/**
 * What the company must still clear after paying the bonus.
 *
 * The contract-value rule above is the one we say out loud, but contract value
 * is a proxy: a big job sold at the floor with thin margin can clear $20,000
 * and still not carry a $2,000 bonus. This is the backstop that actually holds
 * the line, and it is checked on real profit rather than on the proxy.
 */
export const CHANNEL_PARTNER_MIN_COMPANY_NET = 100_000;

export function formatFee(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export type ChannelPartnerPayout = {
  /** The bonus, where the job qualified for it. Zero where it did not. */
  bonus: number;
  /** Half the gross profit, on jobs sold above the threshold. Zero at base. */
  profitShare: number;
  /** What the partner is owed once the job is complete. */
  total: number;
  /** What is left for the company after paying them. Never negative. */
  companyNet: number;
  /** True when the job was big enough to carry the bonus. */
  bonusApplied: boolean;
  /** Why the bonus did not apply, for the admin screen. Null when it did. */
  bonusWithheldReason: string | null;
};

/**
 * What a channel partner earns on one completed job.
 *
 * Takes the deal rather than the raw numbers so the profit being split is
 * exactly the profit the estimator showed the rep — one definition of profit,
 * computed once, in commission.ts.
 *
 * The order matters: the split is worked out first, because it is always
 * affordable (half of what is there can never exceed what is there), and the
 * bonus is added only if what remains still clears the floor. That ordering is
 * what makes every job profitable by construction rather than by luck.
 */
export function channelPartnerPayout(deal: {
  base: number;
  sold: number;
  grossProfit: number;
}): ChannelPartnerPayout {
  const grossProfit = Math.max(Math.round(deal.grossProfit), 0);
  const bonus = Math.round(CHANNEL_PARTNER_FEE_CENTS / 100);
  const minContract = Math.round(CHANNEL_PARTNER_BONUS_MIN_CONTRACT_CENTS / 100);
  const minNet = Math.round(CHANNEL_PARTNER_MIN_COMPANY_NET / 100);

  // Above the threshold, not merely at it: a job sold at base has no overage,
  // and the split is the reward for selling past the floor.
  const profitShare =
    deal.sold > deal.base ? Math.round(grossProfit * CHANNEL_PARTNER_PROFIT_SHARE) : 0;
  const afterShare = grossProfit - profitShare;

  const bigEnough = deal.sold >= minContract;
  const affordable = afterShare - bonus >= minNet;
  const bonusApplied = bigEnough && affordable;

  let bonusWithheldReason: string | null = null;
  if (!bigEnough) {
    bonusWithheldReason =
      `Contract is $${deal.sold.toLocaleString("en-US")}, under the ` +
      `$${minContract.toLocaleString("en-US")} the bonus starts at. Profit split only.`;
  } else if (!affordable) {
    bonusWithheldReason =
      `Job cleared $${minContract.toLocaleString("en-US")} but only made ` +
      `$${grossProfit.toLocaleString("en-US")} gross. Paying the bonus would leave under ` +
      `$${minNet.toLocaleString("en-US")}, so it is the split only. Worth a look at how this one was priced.`;
  }

  const total = profitShare + (bonusApplied ? bonus : 0);

  return {
    bonus: bonusApplied ? bonus : 0,
    profitShare,
    total,
    companyNet: grossProfit - total,
    bonusApplied,
    bonusWithheldReason,
  };
}

/**
 * The customer journey, as a partner sees it.
 *
 * Their own words rather than our pipeline's. "ASSIGNED" means nothing to a
 * solar company; "we're calling them this week" does. The stages are the Lead
 * statuses in prisma/schema.prisma, mapped once here so the page that promises
 * visibility and the page that delivers it can never drift apart.
 */
export type JourneyStage = {
  status: string;
  label: string;
  /** What it means, for the partner's own page. */
  hint: string;
  /** Position in the pipeline. Terminal outcomes sit outside the run. */
  step: number | null;
  /** True once this stage means money is owed. */
  earning: boolean;
};

export const JOURNEY: readonly JourneyStage[] = [
  {
    status: "NEW",
    label: "On your list",
    hint: "We have them. Nobody has called yet.",
    step: 1,
    earning: false,
  },
  {
    status: "ASSIGNED",
    label: "We're calling",
    hint: "One of ours is working on reaching them.",
    step: 2,
    earning: false,
  },
  {
    status: "APPOINTMENT_SET",
    label: "Appointment booked",
    hint: "They agreed to a time and we're going out.",
    step: 3,
    earning: false,
  },
  {
    status: "SOLD",
    label: "Sold — work scheduled",
    hint: "They signed. You've earned it; it pays when the job is finished.",
    step: 4,
    earning: true,
  },
  {
    status: "COMPLETED",
    label: "Finished — you're paid",
    hint: "Job done, money released.",
    step: 5,
    earning: true,
  },
  {
    status: "NO_SALE",
    label: "Quoted, no sale",
    hint: "They got a price and passed. Costs you nothing.",
    step: null,
    earning: false,
  },
  {
    status: "DEAD",
    label: "Not interested",
    hint: "They said no or we couldn't reach them. We won't call again.",
    step: null,
    earning: false,
  },
] as const;

/** The forward run, for drawing the pipeline. */
export const JOURNEY_STEPS = JOURNEY.filter((s) => s.step !== null);

export function journeyStage(status: string): JourneyStage {
  return (
    JOURNEY.find((s) => s.status === status) ?? {
      status,
      label: status,
      hint: "",
      step: null,
      earning: false,
    }
  );
}

/**
 * Hosts we accept a shared customer list from.
 *
 * A allowlist rather than "any https URL" because this field is pasted by
 * someone who was cold-called an hour ago and is about to be asked to share
 * their customers. A typo'd or hostile link sitting in our admin waiting for
 * somebody to click it is a phishing vector aimed at us, and the set of
 * places a real list actually lives is small enough to name.
 */
const LIST_HOSTS = [
  "docs.google.com",
  "drive.google.com",
  "sheets.google.com",
  "dropbox.com",
  "www.dropbox.com",
  "onedrive.live.com",
  "1drv.ms",
  "box.com",
  "app.box.com",
] as const;

export type ListUrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Validate a pasted list link.
 *
 * Returns the normalised URL rather than a boolean so the caller stores what
 * was actually parsed — a link with a stray space or a missing scheme is the
 * normal case here, not the exception.
 */
export function checkListUrl(raw: string): ListUrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Paste the link to your list." };

  // Somebody copying out of a browser bar often loses the scheme. Adding it
  // is the difference between "that link doesn't work" and it just working.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "That doesn't look like a link. Paste the whole thing." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "The link needs to start with https." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!LIST_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    return {
      ok: false,
      reason:
        "We take a Google Sheets, Drive, Dropbox, OneDrive or Box link. If yours lives " +
        "somewhere else, call us and we'll sort it out.",
    };
  }

  return { ok: true, url: parsed.toString() };
}
