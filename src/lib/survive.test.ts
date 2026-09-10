import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { walkPrompt } from "./survive.ts";
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

describe("walkPrompt", () => {
  it("starts at the first blank and stays off the porch", () => {
    const p = walkPrompt("why", blank, { knock: "after work", paper: "", stop: "dark" });
    assert.match(p, /first blank/);
    assert.match(p, /Do not use any of this at a door/);
    assert.match(p, /\(blank\)/);
  });
});
