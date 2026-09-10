import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyWalkAnswer, walkKickoff } from "./survive.ts";
import { demonFilled, whyFilled, type SurviveState } from "./survive-store.ts";

const blank: SurviveState = {
  earned: "",
  byDate: "",
  why1: "",
  why2: "",
  why3: "",
  demon: "",
  origin: "",
  offBlock: "",
  phoneDown: "",
  stackMonth: "2026-09",
  skill: "",
  drill: "",
  patch: () => {},
};

describe("whyFilled / demonFilled", () => {
  it("needs the number and the third why", () => {
    assert.equal(whyFilled(blank), false);
    assert.equal(whyFilled({ ...blank, earned: "80k", why3: "kids" }), true);
  });
  it("treats a named demon as done", () => {
    assert.equal(demonFilled(blank), false);
    assert.equal(demonFilled({ ...blank, demon: "the truck" }), true);
  });
});

describe("walkKickoff", () => {
  it("stays short and off the porch", () => {
    const p = walkKickoff("why");
    assert.match(p, /Walk me through Why/);
    assert.doesNotMatch(p, /I have earned/);
    assert.match(p, /Not a door/);
  });
});

describe("applyWalkAnswer", () => {
  const hours = { knock: "", paper: "", stop: "" };

  it("fills Why in order", () => {
    const a = applyWalkAnswer("why", "80k", blank, hours);
    assert.deepEqual(a, { survive: { earned: "80k" } });
    const b = applyWalkAnswer("why", "Dec 2026", { ...blank, earned: "80k" }, hours);
    assert.deepEqual(b, { survive: { byDate: "Dec 2026" } });
  });
  it("skips filled Pace hours and takes the off-block", () => {
    const p = applyWalkAnswer("pace", "Sunday", blank, { knock: "3-7", paper: "morning", stop: "dark" });
    assert.deepEqual(p, { survive: { offBlock: "Sunday" } });
  });
  it("is done when the sheet is full", () => {
    assert.equal(
      applyWalkAnswer("demon", "more", { ...blank, demon: "truck", origin: "dad" }, hours),
      null,
    );
  });
  it("ignores blank taps", () => {
    assert.equal(applyWalkAnswer("why", "  ", blank, hours), null);
  });
});
