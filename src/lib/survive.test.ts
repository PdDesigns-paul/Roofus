import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyWalkAnswer, parseSkills, surviveKnowledge, toggleSkill, walkKickoff, whyRecap } from "./survive.ts";
import { demonFilled, paceFilled, whyFilled, type SurviveState } from "./survive-store.ts";

const blank: SurviveState = {
  earned: "",
  byDate: "",
  why1: "",
  why2: "",
  why3: "",
  writtenOn: "",
  demon: "",
  origin: "",
  radar: "",
  attack: "",
  offBlock: "",
  phoneDown: "",
  gear: "",
  drop: "",
  alreadyHave: "",
  stackMonth: "2026-09",
  skill: "",
  drill: "",
  windshield: "",
  nightBook: "",
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
  it("does not call Pace written just because Settings have hours", () => {
    assert.equal(paceFilled(blank, "3-7"), false);
    assert.equal(paceFilled({ ...blank, offBlock: "Sunday", gear: "all-day" }), true);
  });
});

describe("whyRecap", () => {
  it("needs the number and the third why", () => {
    assert.equal(whyRecap(blank), null);
    const line = whyRecap({ earned: "80k", byDate: "Dec", why3: "the kids", writtenOn: "2026-09-10" });
    assert.match(line ?? "", /I have earned 80k by Dec/);
    assert.match(line ?? "", /the kids/);
    assert.match(line ?? "", /Written 2026-09-10/);
  });
});

describe("toggleSkill", () => {
  it("caps at three and toggles off", () => {
    let v = "";
    v = toggleSkill(v, "Photos");
    v = toggleSkill(v, "Texts");
    v = toggleSkill(v, "Conflict");
    v = toggleSkill(v, "Truck");
    assert.deepEqual(parseSkills(v), ["Photos", "Texts", "Conflict"]);
    v = toggleSkill(v, "Texts");
    assert.deepEqual(parseSkills(v), ["Photos", "Conflict"]);
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

describe("surviveKnowledge", () => {
  it("is a truck manual: ARO, attacks, no homeowner opener", () => {
    const k = surviveKnowledge();
    assert.match(k, /ARO/);
    assert.match(k, /Acknowledge/);
    assert.match(k, /Reassure/);
    assert.match(k, /Overcome/);
    assert.match(k, /First door in 10/);
    assert.match(k, /Read Why out loud/);
    assert.match(k, /Phone in the other room/);
    assert.match(k, /personal growth that pays/);
    assert.match(k, /After Action Report lives on After/);
    assert.doesNotMatch(k, /AAR lives on Truck/);
    assert.doesNotMatch(k, /on Truck and After/);
    assert.doesNotMatch(k, /I stopped by/);
    assert.doesNotMatch(k, /What.?s going on → original roofs/);
    assert.ok(k.split(/\s+/).filter(Boolean).length < 600);
  });
});

describe("applyWalkAnswer", () => {
  const hours = { knock: "", paper: "", stop: "" };

  it("fills Why in order and stamps the date", () => {
    const a = applyWalkAnswer("why", "80k", blank, hours);
    assert.equal(a?.survive?.earned, "80k");
    assert.match(a?.survive?.writtenOn ?? "", /^\d{4}-\d{2}-\d{2}$/);
    const b = applyWalkAnswer("why", "Dec 2026", { ...blank, earned: "80k" }, hours);
    assert.deepEqual(b, { survive: { byDate: "Dec 2026" } });
  });
  it("skips filled Pace hours and takes the off-block", () => {
    const p = applyWalkAnswer("pace", "Sunday", blank, { knock: "3-7", paper: "morning", stop: "dark" });
    assert.deepEqual(p, { survive: { offBlock: "Sunday" } });
  });
  it("walks demon past origin into radar", () => {
    const p = applyWalkAnswer("demon", "empathy on the porch", { ...blank, demon: "truck", origin: "dad" }, hours);
    assert.deepEqual(p, { survive: { radar: "empathy on the porch" } });
  });
  it("is done when the sheet is full", () => {
    assert.equal(
      applyWalkAnswer(
        "demon",
        "more",
        { ...blank, demon: "truck", origin: "dad", radar: "listen", attack: "fear" },
        hours,
      ),
      null,
    );
  });
  it("maps an attack label", () => {
    const p = applyWalkAnswer(
      "demon",
      "Doubt",
      { ...blank, demon: "truck", origin: "dad", radar: "listen" },
      hours,
    );
    assert.deepEqual(p, { survive: { attack: "doubt" } });
  });
  it("ignores blank taps", () => {
    assert.equal(applyWalkAnswer("why", "  ", blank, hours), null);
  });
});
