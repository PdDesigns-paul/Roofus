import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ASK_STARTERS, I35_SLOTS, PRACTICE_SHOT, WALK_SLOTS, restoreWalk, serializeWalk } from "./inspect-walk.ts";
import { INSPECT_SYSTEM } from "./inspect-system.ts";
import { inspectKnowledgeForShot } from "./mri-index.ts";

describe("WALK_SLOTS", () => {
  it("is the camera walk, not a notes app", () => {
    assert.deepEqual(
      WALK_SLOTS.map((s) => s.id),
      ["street", "slopes", "close", "witness", "attic"],
    );
  });
  it("has a description and sub-shots for each slot", () => {
    for (const s of WALK_SLOTS) {
      assert.ok(s.blurb.length > 8);
      assert.ok(s.checks.length >= 3);
    }
  });
});

describe("I35_SLOTS", () => {
  it("keeps Broce order and a skip", () => {
    assert.deepEqual(I35_SLOTS, ["Bad", "Good", "Worst", "Skip theater"]);
  });
});

describe("ASK_STARTERS", () => {
  it("asks about the frame, the i35 slot, and the house line", () => {
    assert.equal(ASK_STARTERS[0], "What am I looking at?");
    assert.ok(ASK_STARTERS.includes("Is this my worst photo?"));
    assert.ok(ASK_STARTERS.includes("What do I say about this?"));
  });
});

describe("PRACTICE_SHOT", () => {
  it("is a public sample, not a live house", () => {
    assert.equal(PRACTICE_SHOT, "/inspect-practice.png");
  });
});

describe("inspectKnowledgeForShot", () => {
  it("keeps hail, wind, and asphalt, not the full dump", () => {
    const k = inspectKnowledgeForShot();
    assert.match(k, /### Wind/);
    assert.match(k, /### Hail/);
    assert.match(k, /### Asphalt walk/);
    assert.doesNotMatch(k, /### Slate/);
    assert.ok(k.length < 4000);
  });
});

describe("INSPECT_SYSTEM", () => {
  it("names i35 on the frame and refuses a hail verdict", () => {
    assert.match(INSPECT_SYSTEM, /i35 slot/);
    assert.match(INSPECT_SYSTEM, /Skip theater/);
    assert.match(INSPECT_SYSTEM, /Do not call hail or wind a claim verdict/);
    assert.match(INSPECT_SYSTEM, /Walk this house/);
    assert.match(INSPECT_SYSTEM, /This shot/);
    assert.match(INSPECT_SYSTEM, /Name missing tabs/);
    assert.match(INSPECT_SYSTEM, /Do not say insurance will pay/);
  });
});

describe("serializeWalk / restoreWalk", () => {
  it("roundtrips ticks and the open station through JSON", () => {
    const snap = serializeWalk({
      done: { street: true, slopes: true },
      checks: { "street-0": true, "street-1": true, "slopes-0": true },
      openSlot: "slopes",
    });
    const out = restoreWalk(JSON.parse(JSON.stringify(snap)));
    assert.equal(out.done.street, true);
    assert.equal(out.done.slopes, true);
    assert.equal(out.checks["street-0"], true);
    assert.equal(out.checks["slopes-0"], true);
    assert.equal(out.openSlot, "slopes");
  });
  it("drops unknown slots and a missing blob is empty", () => {
    const out = restoreWalk({
      done: { nope: true, street: true, attic: false },
      checks: { "street-0": true, "nope-0": true, "street-99": true },
      openSlot: "nope",
    });
    assert.equal(out.done.street, true);
    assert.equal((out.done as Record<string, boolean>).nope, undefined);
    assert.equal(out.done.attic, undefined);
    assert.equal(out.checks["street-0"], true);
    assert.equal(out.checks["nope-0"], undefined);
    assert.equal(out.checks["street-99"], undefined);
    assert.equal(out.openSlot, null);
    assert.deepEqual(restoreWalk(undefined), { done: {}, checks: {}, openSlot: null });
  });
});
