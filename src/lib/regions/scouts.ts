// What a scout is, and what a scout earns.
//
// A scout signs businesses onto the channel-partner program — the job Kevin
// does today by cold call and LinkedIn. It is the first job the business can
// hand to somebody else, because it is the only one where a stranger can be
// paid purely on an outcome you can count: a partner they signed, whose job
// finished.
//
// The comp is built on the same rule that had to be retrofitted onto the
// partner deal after it was found to lose money on small jobs: NOTHING IS PAID
// ON A SIGNATURE. A scout who signs thirty businesses that never send a job
// earns nothing and costs nothing. Every dollar here comes out of company net
// that exists because the scout created it.
//
// Crucially the override is taken from the COMPANY's share, never the
// partner's. A partner's deal cannot change because we hired someone — that
// would be renegotiating a signed arrangement to pay for our own org chart.

/**
 * Share of company net on every job from a partner this scout signed.
 *
 * The only thing a scout is paid. There was an activation bonus alongside it
 * and it is gone: one rule is easier to explain, easier to trust, and there is
 * no longer any moment in the arrangement where money moves before a job has
 * finished and been paid for.
 */
export const SCOUT_OVERRIDE_RATE = 0.2;

/** How long the override runs on each partner, from their first finished job. */
export const SCOUT_RESIDUAL_MONTHS = 24;

/** Scouts are paid when the partner is — after the work is done, never before. */
export const SCOUT_PAYS_ON = "job completion" as const;

export type ScoutOverride = {
  /** Dollars to the scout on this job. */
  override: number;
  /** What the company keeps after the scout is paid. */
  companyNet: number;
};

/**
 * The scout's cut of one finished job.
 *
 * `companyNet` is what the company kept AFTER the channel partner was paid —
 * see channelPartnerPayout() in channelPartners.ts, whose `companyNet` is the
 * figure to pass in here. Taking the override from anything upstream of that
 * would put the scout ahead of the partner in the queue.
 */
export function scoutOverride(companyNet: number): ScoutOverride {
  const base = Math.max(Math.round(companyNet), 0);
  const override = Math.round(base * SCOUT_OVERRIDE_RATE);
  return { override, companyNet: base - override };
}

export type RampAssumptions = {
  /** Partners signed per month. */
  signsPerMonth: number;
  /** Share of signed partners that ever send a job. */
  activationRate: number;
  /** Months between signing and the first finished job. */
  lagMonths: number;
  /** Finished jobs a producing partner sends per month. */
  jobsPerPartnerMonth: number;
  /** Average company net per finished job, in dollars. */
  companyNetPerJob: number;
};

/**
 * What the deal looks like month by month for one scout.
 *
 * This is a model, not history, and it is the honest version: flat for the
 * first couple of months because nothing pays until a partner's first job
 * actually finishes. Anybody shown this should be told which numbers are
 * assumptions — they are all in `RampAssumptions` for exactly that reason.
 */
export const DEFAULT_RAMP: RampAssumptions = {
  signsPerMonth: 3,
  activationRate: 0.6,
  lagMonths: 2,
  jobsPerPartnerMonth: 0.7,
  companyNetPerJob: 1_750,
};

export type RampMonth = {
  month: number;
  /** Partners signed so far. */
  signed: number;
  /** Partners now sending work. */
  producing: number;
  /** Finished jobs this month across their partners. */
  jobs: number;
  override: number;
  total: number;
};

export function scoutRamp(months: number, a: RampAssumptions = DEFAULT_RAMP): RampMonth[] {
  const out: RampMonth[] = [];
  for (let m = 1; m <= months; m++) {
    const producing = Math.max(0, m - a.lagMonths) * a.signsPerMonth * a.activationRate;
    const jobs = producing * a.jobsPerPartnerMonth;
    const override = Math.round(jobs * a.companyNetPerJob * SCOUT_OVERRIDE_RATE);
    out.push({
      month: m,
      signed: m * a.signsPerMonth,
      producing: Math.round(producing * 10) / 10,
      jobs: Math.round(jobs * 10) / 10,
      override,
      total: override,
    });
  }
  return out;
}

/** What the scout costs as a share of the company net they generated. */
export function scoutCostShare(a: RampAssumptions = DEFAULT_RAMP, atMonth = 24): number {
  const row = scoutRamp(atMonth, a)[atMonth - 1];
  const generated = row.jobs * a.companyNetPerJob;
  return generated > 0 ? row.total / generated : 0;
}

/** The three things a scout is actually measured on. Used on /scouts and later in their portal. */
export const SCOUT_SCOREBOARD = [
  {
    key: "SIGNED",
    label: "Signed",
    hint: "Businesses that finished onboarding and have a login.",
  },
  {
    key: "ACTIVATED",
    label: "Activated",
    hint: "Of those, the ones whose first job has finished. This is the one that pays.",
  },
  {
    key: "PRODUCING",
    label: "Still producing",
    hint: "Partners who sent work in the last 90 days.",
  },
] as const;

export const SCOUT_ROLE = "SCOUT" as const;
export const CLOSER_ROLE = "CLOSER" as const;
