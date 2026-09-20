import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  EBR_ENQUIRY_MONTHS,
  EBR_TRANSACTION_MONTHS,
  isOptOut,
  mayDialConsumer,
  mayEmail,
  maySms,
} from "../src/lib/integrations/consent";
import { isAutodialable } from "../src/lib/regions/calling";
import { eligibleCrews, offerMessage, offerExpiry, OFFER_TTL_HOURS } from "../src/lib/integrations/dispatch";
import { greetingName, CADENCE, nextTouchDue } from "../src/lib/regions/partnerProspects";

// The rules that stop this business getting sued.
//
// Everything here is a non-negotiable from CLAUDE.md §3 turned into an
// assertion. The point is not that the code works today — it is that a
// future change which quietly loosens one of these fails loudly instead of
// shipping.

const NOW = new Date("2026-09-20T12:00:00Z");
const ago = (months: number) => {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - months);
  return d;
};

describe("autodialling is impossible by construction", () => {
  test("isAutodialable can never return true", () => {
    assert.equal(isAutodialable(), false);
  });
});

describe("marketing SMS consent", () => {
  test("allows a number the person typed into our own form", () => {
    assert.equal(maySms({ smsConsentAt: ago(1), smsConsentSource: "WEB_FORM" }, NOW).allowed, true);
  });

  test("refuses a bulk import asserting its own consent", () => {
    // The uploader's word is not the subscriber's consent. This is the
    // single rule that stands between a CSV and a seven-figure exposure.
    const r = maySms({ smsConsentAt: ago(1), smsConsentSource: "IMPORTED" }, NOW);
    assert.equal(r.allowed, false);
    assert.match(r.reason!, /uploader/i);
  });

  test("refuses when there is no consent record at all", () => {
    assert.equal(maySms({}, NOW).allowed, false);
  });

  test("an opt-out beats a valid consent record", () => {
    const r = maySms(
      { smsConsentAt: ago(1), smsConsentSource: "WEB_FORM", optedOutAt: ago(0) },
      NOW,
    );
    assert.equal(r.allowed, false);
    assert.match(r.reason!, /opted out/i);
  });
});

describe("dialling a consumer", () => {
  test("allows inside the transaction window and refuses outside it", () => {
    assert.equal(mayDialConsumer({ lastTransactionAt: ago(EBR_TRANSACTION_MONTHS - 1) }, NOW).allowed, true);
    assert.equal(mayDialConsumer({ lastTransactionAt: ago(EBR_TRANSACTION_MONTHS + 1) }, NOW).allowed, false);
  });

  test("allows inside the enquiry window and refuses outside it", () => {
    assert.equal(mayDialConsumer({ lastEnquiryAt: ago(EBR_ENQUIRY_MONTHS - 1) }, NOW).allowed, true);
    assert.equal(mayDialConsumer({ lastEnquiryAt: ago(EBR_ENQUIRY_MONTHS + 1) }, NOW).allowed, false);
  });

  test("refuses an aged list with nothing on file", () => {
    const r = mayDialConsumer({}, NOW);
    assert.equal(r.allowed, false);
    assert.ok(r.remedy, "a block must say what would unblock it");
  });

  test("an opt-out beats explicit call consent", () => {
    assert.equal(mayDialConsumer({ callConsentAt: ago(1), optedOutAt: ago(0) }, NOW).allowed, false);
  });
});

describe("email is the lawful way into an aged list", () => {
  test("allowed with no prior consent", () => {
    assert.equal(mayEmail({}).allowed, true);
  });
  test("but not after an opt-out", () => {
    assert.equal(mayEmail({ optedOutAt: ago(0) }).allowed, false);
  });
});

describe("opt-out detection", () => {
  test("catches the standard keywords and plain English", () => {
    for (const m of ["STOP", " stop ", "Unsubscribe", "please stop texting me", "do not call me", "remove me"]) {
      assert.equal(isOptOut(m), true, `should have caught: ${m}`);
    }
  });
  test("does not fire on an interested reply", () => {
    for (const m of ["yes interested", "call me tomorrow", "what's the price", "sounds good"]) {
      assert.equal(isOptOut(m), false, `false positive on: ${m}`);
    }
  });
});

describe("crew dispatch eligibility", () => {
  const base = {
    id: "c1",
    name: "Crew",
    phone: "+17205550100",
    state: "CO",
    city: "Denver",
    generalLiabilityOnFile: true,
    insuranceExpiresAt: new Date("2027-01-01"),
    w9OnFile: true,
    status: "ACTIVE",
  };

  test("insurance is a hard gate", () => {
    const { eligible, blocked } = eligibleCrews(
      [{ ...base, generalLiabilityOnFile: false }],
      { state: "CO" },
      NOW,
    );
    assert.equal(eligible.length, 0);
    assert.match(blocked[0].reason, /liability/i);
  });

  test("expired insurance blocks, and says so", () => {
    const { eligible, blocked } = eligibleCrews(
      [{ ...base, insuranceExpiresAt: new Date("2026-01-01") }],
      { state: "CO" },
      NOW,
    );
    assert.equal(eligible.length, 0);
    assert.match(blocked[0].reason, /expired/i);
  });

  test("a missing W-9 does NOT block the offer", () => {
    // It blocks the payout, which is enforced elsewhere. Refusing to offer
    // work over paperwork that can be filed while the job runs costs the job.
    const { eligible } = eligibleCrews([{ ...base, w9OnFile: false }], { state: "CO" }, NOW);
    assert.equal(eligible.length, 1);
  });

  test("wrong state blocks", () => {
    const { eligible, blocked } = eligibleCrews([base], { state: "MO" }, NOW);
    assert.equal(eligible.length, 0);
    assert.match(blocked[0].reason, /CO.*MO|MO.*CO/);
  });

  test("blocked reasons are returned, not just filtered away", () => {
    // "Nobody available" and "everyone nearby has lapsed insurance" need
    // different responses, and a filtered array cannot tell them apart.
    const { blocked } = eligibleCrews(
      [
        { ...base, id: "a", generalLiabilityOnFile: false },
        { ...base, id: "b", status: "APPLIED" },
      ],
      { state: "CO" },
      NOW,
    );
    assert.equal(blocked.length, 2);
    assert.ok(blocked.every((b) => b.reason.length > 0));
  });
});

describe("the dispatch offer", () => {
  test("leads with the money and carries the link", () => {
    const m = offerMessage({
      workAmount: 4500,
      trade: "FENCE",
      city: "Denver",
      state: "CO",
      acceptUrl: "https://x.test/crew/offer/abc",
    });
    assert.match(m, /\$4,500/);
    assert.match(m, /Denver, CO/);
    assert.match(m, /https:\/\/x\.test\/crew\/offer\/abc/);
  });

  test("expiry is the stated window", () => {
    const e = offerExpiry(NOW);
    assert.equal(e.getTime() - NOW.getTime(), OFFER_TTL_HOURS * 3600 * 1000);
  });
});

describe("partner outreach personalisation", () => {
  test("uses the owner's first name when we have one", () => {
    assert.equal(greetingName({ contactName: "Mike Delgado", businessName: "X LLC" }), "Mike");
  });

  test("falls back to the business with its legal suffix stripped", () => {
    assert.equal(greetingName({ contactName: null, businessName: "Bluebird Solar, Inc" }), "Bluebird Solar");
    assert.equal(greetingName({ contactName: "", businessName: "Summit Plumbing Co." }), "Summit Plumbing");
  });

  test("never returns an empty greeting", () => {
    for (const n of ["LLC", "Inc", "  Co  ", "A&B Co"]) {
      assert.ok(greetingName({ contactName: null, businessName: n }).length > 0, `empty for ${n}`);
    }
  });
});

describe("the follow-up cadence", () => {
  test("gaps widen rather than narrow", () => {
    for (let i = 1; i < CADENCE.length; i++) {
      assert.ok(CADENCE[i].day > CADENCE[i - 1].day, `step ${i + 1} is not after step ${i}`);
    }
  });

  test("the channel rotates so it is never the same interruption twice running", () => {
    for (let i = 1; i < CADENCE.length; i++) {
      assert.notEqual(CADENCE[i].channel, CADENCE[i - 1].channel, `steps ${i} and ${i + 1} share a channel`);
    }
  });

  test("the sequence ends rather than looping forever", () => {
    assert.equal(nextTouchDue(CADENCE.length, NOW), null);
  });
});
