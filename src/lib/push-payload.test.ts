import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPushFaq, packDrawer, unpackDrawer, type PushDrawer } from "./push-payload.ts";
import { blankReminderPrefs } from "./reminders.ts";

describe("push drawer", () => {
  it("hides the Memory row from FAQs", () => {
    assert.equal(isPushFaq("_roofus_push"), true);
    assert.equal(isPushFaq("What is SLAP?"), false);
  });

  it("round-trips small enough for a Notion cell", () => {
    const d: PushDrawer = {
      vapidPublic: "B" + "x".repeat(80),
      vapidPrivate: "y".repeat(40),
      subscription: {
        endpoint: "https://web.push.apple.com/abc",
        keys: { p256dh: "p", auth: "a" },
      },
      prefs: blankReminderPrefs(),
      snap: { ready: true, afterAction: "", stormFetchedOn: "2026-09-10", stackMonth: "" },
    };
    const packed = packDrawer(d);
    assert.ok(packed.length < 1900);
    const back = unpackDrawer(packed);
    assert.equal(back?.vapidPublic, d.vapidPublic);
    assert.equal(back?.subscription?.endpoint, d.subscription?.endpoint);
    assert.equal(back?.snap.ready, true);
  });
});
