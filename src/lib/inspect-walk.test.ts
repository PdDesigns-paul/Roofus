import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { I35_SLOTS, PRACTICE_SHOT, emptyWalk, restoreWalk, serializeWalk, walkHasTicks } from "./inspect-walk.ts";
import { inspectSystem, INSPECT_SYSTEM } from "./inspect-system.ts";
import { inspectKnowledgeForShot } from "./mri-index.ts";
import { pack } from "./tenant/index.ts";

describe("pack inspect steps", () => {
  it("Roofus pack length is the current five stations", () => {
    assert.equal(pack.inspect.steps.length, 5);
    assert.deepEqual(
      pack.inspect.steps.map((s) => s.id),
      ["street", "slopes", "close", "witness", "attic"],
    );
  });
  it("blank walk has one key per pack step", () => {
    const blank = emptyWalk();
    assert.equal(Object.keys(blank.done).length, pack.inspect.steps.length);
    assert.equal(Object.keys(blank.done).length, 5);
    assert.equal(blank.done.street, false);
    assert.equal(blank.openSlot, null);
    assert.equal(walkHasTicks(blank), false);
  });
  it("each step has title, hint, askPrompt, and sub-shots", () => {
    for (const s of pack.inspect.steps) {
      assert.ok(s.title.length > 0);
      assert.ok(s.hint.length > 8);
      assert.ok(s.askPrompt.length > 0);
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

describe("ask starters", () => {
  it("asks about the frame, the i35 slot, and the house line", () => {
    assert.equal(pack.inspect.askStarters[0], "What am I looking at?");
    assert.ok(pack.inspect.askStarters.includes("Is this my worst photo?"));
    assert.ok(pack.inspect.askStarters.includes("What do I say about this?"));
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
  it("takes walk titles and the report name from the pack", () => {
    assert.match(INSPECT_SYSTEM, /Street, Four slopes, Close-up, Witnesses, Attic/);
    assert.match(INSPECT_SYSTEM, /CompanyCam is the report/);
    assert.match(INSPECT_SYSTEM, /from the Roof page/);
    const other = inspectSystem({
      ...pack,
      talkName: "Scout",
      places: { ...pack.places, inspect: "Inspect" },
      inspect: {
        ...pack.inspect,
        reportName: "JobFolder",
        steps: [
          { id: "site", title: "Site", hint: "h", askPrompt: "a", blurb: "b", checks: ["One"] },
          { id: "proof", title: "Proof", hint: "h", askPrompt: "a", blurb: "b", checks: ["One"] },
        ],
      },
    });
    assert.match(other, /from the Inspect page/);
    assert.match(other, /Walk this house: Site, Proof/);
    assert.match(other, /JobFolder is the report/);
    assert.doesNotMatch(other, /Four slopes/);
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
  it("keeps old Roofus keys and drops unknown slots", () => {
    const out = restoreWalk({
      done: { nope: true, street: true, attic: false },
      checks: { "street-0": true, "nope-0": true, "street-99": true },
      openSlot: "nope",
    });
    assert.equal(out.done.street, true);
    assert.equal(out.done.nope, undefined);
    assert.equal(out.done.attic, false);
    assert.equal(out.checks["street-0"], true);
    assert.equal(out.checks["nope-0"], undefined);
    assert.equal(out.checks["street-99"], undefined);
    assert.equal(out.openSlot, null);
    const empty = restoreWalk(undefined);
    assert.equal(Object.keys(empty.done).length, pack.inspect.steps.length);
    assert.equal(empty.done.street, false);
    assert.equal(empty.openSlot, null);
  });
  it("walkHasTicks is true only when a station is marked", () => {
    assert.equal(walkHasTicks(undefined), false);
    assert.equal(walkHasTicks(restoreWalk({})), false);
    assert.equal(walkHasTicks({ done: { street: true }, checks: {}, openSlot: null }), true);
  });
});
