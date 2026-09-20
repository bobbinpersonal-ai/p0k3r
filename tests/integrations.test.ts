import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { normaliseAppointment } from "../src/lib/integrations/ghl";
import { parseCallEvent, attributionLabel, worthALead, MIN_CALL_SECONDS } from "../src/lib/integrations/callrail";
import { parseSignatureEvent, isSigned } from "../src/lib/integrations/pandadoc";
import { safeEqual } from "../src/lib/integrations/config";

// The adapters.
//
// These parse things other people send us, which means they get malformed
// input in production and must never 500 on it. Every one of these tests is
// really asking the same question: does a bad payload come back as a stated
// reason rather than an exception.

describe("GHL appointment payloads", () => {
  test("accepts a complete payload", () => {
    const r = normaliseAppointment({
      contactId: "c1",
      firstName: "Marisol",
      lastName: "Trent",
      phone: "(720) 555-0199",
      address1: "118 Cedar Ridge Dr",
      city: "Longmont",
      state: "co",
      postalCode: "80501",
    });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.value.customerName, "Marisol Trent");
      assert.equal(r.value.customerPhone, "+17205550199");
      assert.equal(r.value.state, "CO");
    }
  });

  test("refuses with a reason rather than throwing", () => {
    for (const [payload, pattern] of [
      [{}, /contactId/i],
      [{ contactId: "c1" }, /name/i],
      [{ contactId: "c1", fullName: "X" }, /phone/i],
      [{ contactId: "c1", fullName: "X", phone: "12" }, /phone/i],
    ] as const) {
      const r = normaliseAppointment(payload);
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.error, pattern);
    }
  });

  test("supplies the address placeholder, because Lead.address is NOT NULL", () => {
    const r = normaliseAppointment({ contactId: "c1", fullName: "X Y", phone: "7205550199" });
    assert.equal(r.ok, true);
    if (r.ok) assert.ok(r.value.address.length > 0);
  });

  test("survives a garbage start time instead of storing Invalid Date", () => {
    const r = normaliseAppointment({
      contactId: "c1",
      fullName: "X Y",
      phone: "7205550199",
      startTime: "not a date",
    });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.startsAt, null);
  });
});

describe("CallRail events", () => {
  const base = {
    id: "CAL1",
    direction: "inbound",
    customer_phone_number: "+17205550199",
    source: "Google Ads",
    campaign: "roofing-denver",
    keywords: "roof replacement",
    duration: 95,
    answered: true,
  };

  test("builds a groupable attribution label", () => {
    const e = parseCallEvent(base)!;
    assert.equal(attributionLabel(e), "callrail:Google Ads/roofing-denver/roof replacement");
  });

  test("a short or unanswered call does not become a lead", () => {
    assert.equal(worthALead(parseCallEvent({ ...base, duration: MIN_CALL_SECONDS - 1 })!), false);
    assert.equal(worthALead(parseCallEvent({ ...base, answered: false })!), false);
    assert.equal(worthALead(parseCallEvent({ ...base, direction: "outbound" })!), false);
    assert.equal(worthALead(parseCallEvent(base)!), true);
  });

  test("returns null on junk rather than throwing", () => {
    assert.equal(parseCallEvent(null), null);
    assert.equal(parseCallEvent({}), null);
    assert.equal(parseCallEvent("nope"), null);
  });
});

describe("PandaDoc signature events", () => {
  test("reads the version that was signed", () => {
    const e = parseSignatureEvent([
      {
        data: {
          id: "doc1",
          status: "document.completed",
          date_completed: "2026-09-20T10:00:00Z",
          metadata: { subjectId: "p1", kind: "CHANNEL_PARTNER", documentVersion: "2026-09-18.3" },
        },
      },
    ]);
    assert.ok(e);
    assert.equal(e!.documentVersion, "2026-09-18.3");
    assert.equal(isSigned(e!), true);
  });

  test("a draft event is not a signature", () => {
    const e = parseSignatureEvent([{ data: { id: "d", status: "document.draft" } }]);
    assert.equal(isSigned(e!), false);
  });

  test("returns null on junk", () => {
    assert.equal(parseSignatureEvent([]), null);
    assert.equal(parseSignatureEvent({}), null);
    assert.equal(parseSignatureEvent([{ data: {} }]), null);
  });
});

describe("webhook secret comparison", () => {
  test("an unset secret never matches, so an unconfigured hook is closed", () => {
    assert.equal(safeEqual(undefined, "abc"), false);
    assert.equal(safeEqual("abc", undefined), false);
    assert.equal(safeEqual(undefined, undefined), false);
  });

  test("matches only an exact value", () => {
    assert.equal(safeEqual("secret", "secret"), true);
    assert.equal(safeEqual("secret", "secrel"), false);
    assert.equal(safeEqual("secret", "secret "), false);
    assert.equal(safeEqual("secret", "sec"), false);
  });
});
