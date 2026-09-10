import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankDay, EMPTY_COUNTS, localDateKey, packAfterAction, unpackAfterAction } from "./day-book.ts";

describe("localDateKey", () => {
  it("is YYYY-MM-DD in local time", () => {
    assert.equal(localDateKey(new Date(2026, 8, 9, 22, 0, 0)), "2026-09-09");
  });
});

describe("blankDay", () => {
  it("starts at zero with empty report fields", () => {
    const d = blankDay("2026-09-09");
    assert.equal(d.date, "2026-09-09");
    assert.deepEqual(
      { knocks: d.knocks, talks: d.talks, looks: d.looks, sets: d.sets },
      EMPTY_COUNTS,
    );
    assert.equal(d.afterAction, "");
  });
});

describe("packAfterAction", () => {
  it("roundtrips three boxes", () => {
    const packed = packAfterAction({ wins: "first door", better: "talked over them", plan: "three hows" });
    assert.match(packed, /^Wins: /);
    const out = unpackAfterAction(packed);
    assert.equal(out.wins, "first door");
    assert.equal(out.better, "talked over them");
    assert.equal(out.plan, "three hows");
  });
  it("puts an old unlabeled blob in wins", () => {
    const out = unpackAfterAction("knocked 40\ngot a set");
    assert.equal(out.wins, "knocked 40\ngot a set");
    assert.equal(out.better, "");
  });
});
