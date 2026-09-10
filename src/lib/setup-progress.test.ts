import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySetupAnswer,
  companyOf,
  nextIncomplete,
  rowDone,
  setupScore,
  setupSnap,
  type SetupSnap,
} from "./setup-progress.ts";
import type { SurviveState } from "./survive-store.ts";

const blankSurvive = {
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
  stackMonth: "",
  skill: "",
  drill: "",
  windshield: "",
  nightBook: "",
  patch: () => undefined,
} as SurviveState;

function snap(over: Partial<SetupSnap> = {}): SetupSnap {
  return {
    goBy: "",
    company: "",
    counties: "",
    states: "",
    knockWindow: "",
    paperWindow: "",
    hardStop: "",
    warranty: "",
    zipCount: 0,
    why: false,
    demon: false,
    pace: false,
    stack: false,
    ...over,
  };
}

describe("companyOf", () => {
  it("prefers Presets unless it is still the default", () => {
    assert.equal(companyOf("Ridge", "Roofus"), "Ridge");
    assert.equal(companyOf("Ridge", "Alpha"), "Alpha");
    assert.equal(companyOf("", "Roofus"), "");
  });
});

describe("setupScore", () => {
  it("is ready when territory is filled, even if Why is blank", () => {
    const s = setupSnap({
      goBy: "Paul",
      profileCompany: "",
      settingsCompany: "Ridge",
      counties: "Dauphin",
      states: "PA",
      knockWindow: "",
      paperWindow: "",
      hardStop: "",
      warranty: "",
      zipCount: 0,
      survive: blankSurvive,
    });
    assert.equal(rowDone("you", s), true);
    assert.equal(rowDone("territory", s), true);
    const score = setupScore(s);
    assert.equal(score.ready, true);
    assert.equal(score.done, 2);
    assert.equal(score.total, 8);
  });
});

describe("nextIncomplete", () => {
  it("stays on the preferred row until that row is done", () => {
    assert.equal(nextIncomplete(snap({ goBy: "P" }), "you"), "you");
    assert.equal(nextIncomplete(snap({ goBy: "P", company: "Ridge" }), "you"), "territory");
  });
});

describe("applySetupAnswer", () => {
  it("fills name then company, and copies company into both stores", () => {
    const a = applySetupAnswer("you", "Paul", snap(), blankSurvive);
    assert.equal(a?.profile?.goBy, "Paul");
    const b = applySetupAnswer("you", "Ridge", snap({ goBy: "Paul" }), blankSurvive);
    assert.equal(b?.companyName, "Ridge");
    assert.equal(b?.profile?.company, "Ridge");
  });

  it("does not invent zips in chat", () => {
    assert.equal(applySetupAnswer("zips", "17050", snap(), blankSurvive), null);
  });

  it("saves a website on the You row without treating it as a name", () => {
    const a = applySetupAnswer("you", "https://northridge.example", snap(), blankSurvive);
    assert.equal(a?.companyWebsite, "https://northridge.example/");
    assert.equal(a?.profile?.goBy, undefined);
  });
});
