import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CHANNEL_PARTNER_PROFIT_SHARE,
  MARGIN_FLOOR,
  channelPartnerPayout,
  marginCheck,
} from "../src/lib/regions/channelPartners";
import {
  CONTRACTOR_OVERAGE_RATE,
  CONTRACTOR_TERMS,
  OVERAGE_RATE,
  dealAt,
} from "../src/lib/regions/commission";
import { TRADES, priceJob } from "../src/lib/regions/trades";
import { scoutOverride } from "../src/lib/regions/scouts";
import { splitFor } from "../src/lib/integrations/stripeConnect";
import { monthlyPayment, quote, FINANCING_MIN_AMOUNT } from "../src/lib/regions/financing";

// The money functions.
//
// These decide what people are paid. They are pure, so there is no excuse
// for not testing them, and CLAUDE.md has listed their absence as the
// highest-value gap in the project for a while.
//
// The important tests here are not the arithmetic — that is easy. They are
// the INVARIANTS: that the floor cannot be sold through, that the split
// cannot exceed what exists, that two independent code paths computing the
// same payout agree, and that nothing in the price book trips the margin
// floor. Those are the properties that make the business safe to run, and
// they are the ones a future change is most likely to break silently.

describe("commission", () => {
  test("refuses a price below the floor rather than clamping it", () => {
    assert.equal(dealAt({ cost: 100, base: 200 }, 199), undefined);
    assert.equal(dealAt({ cost: 100, base: 200 }, 0), undefined);
    assert.equal(dealAt({ cost: 100, base: 200 }, -50), undefined);
    assert.notEqual(dealAt({ cost: 100, base: 200 }, 200), undefined);
  });

  test("a contractor earns less of the overage than a dedicated closer", () => {
    // They are paid the cost line to build it as well, so pricing both at
    // the closer's rate leaves nothing to pay the partner and scout from.
    assert.ok(CONTRACTOR_OVERAGE_RATE < OVERAGE_RATE);
  });

  test("overage commission is the stated share of what was sold above base", () => {
    const d = dealAt({ cost: 6000, base: 10000 }, 14000, CONTRACTOR_TERMS)!;
    assert.equal(d.overage, 4000);
    assert.equal(d.overageCommission, 4000 * CONTRACTOR_OVERAGE_RATE);
    assert.equal(d.grossProfit, 14000 - 6000 - d.commission);
  });

  test("selling at exactly base earns no overage but is allowed", () => {
    const d = dealAt({ cost: 6000, base: 10000 }, 10000, CONTRACTOR_TERMS)!;
    assert.equal(d.overage, 0);
    assert.equal(d.overageCommission, 0);
    assert.equal(d.grossProfit, 4000);
  });
});

describe("channel partner payout", () => {
  test("pays the stated share of gross profit", () => {
    const p = channelPartnerPayout({ base: 10000, sold: 12000, grossProfit: 5000 });
    assert.equal(p.total, Math.round(5000 * CHANNEL_PARTNER_PROFIT_SHARE));
    assert.equal(p.companyNet, 5000 - p.total);
  });

  test("a job sold at book price still pays — there is no threshold", () => {
    const p = channelPartnerPayout({ base: 10000, sold: 10000, grossProfit: 3400 });
    assert.ok(p.total > 0, "a job at base must still pay the partner");
  });

  test("never pays more than the profit that exists", () => {
    // The whole reason the formula is a share of profit rather than of the
    // contract: 40% of what exists can never exceed what exists.
    for (const gp of [0, 1, 37, 5000, 999_999]) {
      const p = channelPartnerPayout({ base: 1000, sold: 2000, grossProfit: gp });
      assert.ok(p.total <= gp, `paid ${p.total} out of ${gp}`);
      assert.ok(p.companyNet >= 0, "company net went negative");
    }
  });

  test("a loss-making job pays nothing rather than a negative", () => {
    const p = channelPartnerPayout({ base: 10000, sold: 9000, grossProfit: -2000 });
    assert.equal(p.total, 0);
    assert.equal(p.companyNet, 0);
  });
});

describe("margin floor", () => {
  test("flags a job that keeps less than the floor", () => {
    assert.equal(marginCheck(10000, 1000).ok, false);
    assert.equal(marginCheck(10000, 1499).ok, false);
  });

  test("passes a job exactly on the floor", () => {
    assert.equal(marginCheck(10000, 10000 * MARGIN_FLOOR).ok, true);
  });

  test("a job with no contract value is never ok", () => {
    assert.equal(marginCheck(0, 0).ok, false);
  });
});

describe("the price book clears the floor everywhere", () => {
  test("no trade, option, size or markup trips the margin floor", () => {
    // The claim CLAUDE.md makes, asserted rather than remembered. If a
    // future price change breaks it, this fails instead of a crew getting
    // paid out of a job that could not afford them.
    let worst = { margin: 1, label: "" };
    let scenarios = 0;

    for (const trade of TRADES) {
      for (const option of trade.options) {
        for (const q of [trade.minimumUnits, trade.minimumUnits * 3, trade.minimumUnits * 6]) {
          const { cost, base } = priceJob([
            { trade: trade.value, option: option.value, quantity: Math.round(q) },
          ]);
          if (base <= 0) continue;

          for (const mult of [1.0, 1.1, 1.25, 1.5]) {
            const sold = Math.round(base * mult);
            const deal = dealAt({ cost, base }, sold, CONTRACTOR_TERMS);
            if (!deal) continue;

            const partner = channelPartnerPayout({
              base,
              sold,
              grossProfit: deal.grossProfit,
              cost,
              sellerCommission: deal.commission,
            });
            // Worst case: a scout override stacked on the partner's share.
            const afterScout = scoutOverride(partner.companyNet);
            const check = marginCheck(sold, afterScout.companyNet);
            scenarios++;

            if (check.margin < worst.margin) {
              worst = {
                margin: check.margin,
                label: `${trade.value}/${option.value} ${q}u x${mult}`,
              };
            }
            assert.ok(
              check.ok,
              `${trade.value}/${option.value} ${q}u x${mult} keeps only ${(check.margin * 100).toFixed(1)}%`,
            );
          }
        }
      }
    }

    assert.ok(scenarios > 200, `expected a broad sweep, only ran ${scenarios}`);
    assert.ok(worst.margin >= MARGIN_FLOOR, `worst was ${worst.label}`);
  });
});

describe("stripe split agrees with the domain", () => {
  test("splitFor matches channelPartnerPayout and marginCheck exactly", () => {
    // Two independent code paths compute the same payout. If they ever
    // disagree the money divides differently depending on which ran, which
    // is the worst possible class of bug here.
    const { cost, base } = priceJob([
      { trade: "ROOFING", option: "OC_DURATION", quantity: 25 },
    ]);
    for (const mult of [1.0, 1.15, 1.3, 1.5]) {
      const sold = Math.round(base * mult);
      const deal = dealAt({ cost, base }, sold, CONTRACTOR_TERMS)!;

      const split = splitFor({
        soldPrice: sold,
        costTotal: cost,
        sellerCommission: deal.commission,
        hasChannelPartner: true,
      });
      const partner = channelPartnerPayout({
        base,
        sold,
        grossProfit: deal.grossProfit,
        cost,
        sellerCommission: deal.commission,
      });

      assert.equal(split.channelPartnerAmount, partner.total, `partner at x${mult}`);
      assert.equal(split.companyNet, partner.companyNet, `net at x${mult}`);
      assert.equal(split.clearsFloor, marginCheck(sold, partner.companyNet).ok, `floor at x${mult}`);
      assert.equal(split.contractorAmount, cost, `crew at x${mult}`);
    }
  });

  test("no channel partner means no partner share", () => {
    const s = splitFor({
      soldPrice: 14625,
      costTotal: 9625,
      sellerCommission: 0,
      hasChannelPartner: false,
    });
    assert.equal(s.channelPartnerAmount, 0);
    assert.equal(s.companyNet, s.grossProfit);
  });

  test("the split never distributes more than came in", () => {
    for (const sold of [2000, 9000, 14625, 48000]) {
      const s = splitFor({
        soldPrice: sold,
        costTotal: Math.round(sold * 0.6),
        sellerCommission: Math.round(sold * 0.05),
        hasChannelPartner: true,
      });
      const out = s.contractorAmount + s.channelPartnerAmount + s.companyNet;
      assert.ok(out <= sold, `paid out ${out} of ${sold}`);
    }
  });
});

describe("the $2,000 claim", () => {
  test("a typical 25-square re-roof at book price pays the partner $2,000", () => {
    // The number on the marketing page, the script and the SMS. If a price
    // change moves it, this fails rather than the claim quietly becoming a
    // lie in four places at once.
    const { cost, base } = priceJob([
      { trade: "ROOFING", option: "OC_DURATION", quantity: 25 },
    ]);
    const deal = dealAt({ cost, base }, base, CONTRACTOR_TERMS)!;
    const partner = channelPartnerPayout({
      base,
      sold: base,
      grossProfit: deal.grossProfit,
      cost,
      sellerCommission: deal.commission,
    });
    assert.equal(partner.total, 2000);
  });

  test("and it is the floor for that job, not the ceiling", () => {
    const { cost, base } = priceJob([
      { trade: "ROOFING", option: "OC_DURATION", quantity: 25 },
    ]);
    const marked = Math.round(base * 1.15);
    const deal = dealAt({ cost, base }, marked, CONTRACTOR_TERMS)!;
    const partner = channelPartnerPayout({ base, sold: marked, grossProfit: deal.grossProfit });
    assert.ok(partner.total > 2000, "a marked-up job must pay more, not less");
  });
});

describe("financing", () => {
  test("amortisation matches known values", () => {
    assert.ok(Math.abs(monthlyPayment(10000, 0.0999, 60) - 212.47) < 0.75);
    assert.ok(Math.abs(monthlyPayment(25000, 0.1299, 120) - 373.24) < 0.75);
  });

  test("a zero-rate promotional plan does not divide by zero", () => {
    assert.equal(monthlyPayment(12000, 0, 24), 500);
    assert.ok(Number.isFinite(monthlyPayment(12000, 0, 24)));
  });

  test("degenerate inputs return zero rather than NaN", () => {
    assert.equal(monthlyPayment(0, 0.1, 60), 0);
    assert.equal(monthlyPayment(1000, 0.1, 0), 0);
    assert.equal(monthlyPayment(-1000, 0.1, 60), 0);
  });

  test("quotes nothing when no lender terms are configured", () => {
    // The Regulation Z guard: no real APR means no payment figure, ever.
    assert.equal(quote(15000), null);
    assert.equal(quote(FINANCING_MIN_AMOUNT - 1), null);
  });
});
