import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyCoachWrite } from "./coach-write.ts";
import type { SurviveState } from "./survive-store.ts";
import type { SetupSnap } from "./setup-progress.ts";

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

describe("applyCoachWrite", () => {
  it("saves a pasted website", () => {
    const a = applyCoachWrite("https://northridge.example", snap({ goBy: "Jordan", company: "North Ridge" }), blankSurvive);
    assert.equal(a?.companyWebsite, "https://northridge.example/");
  });
  it("saves my website is …", () => {
    const a = applyCoachWrite("my website is northridge.example", snap(), blankSurvive);
    assert.equal(a?.companyWebsite, "https://northridge.example/");
  });
  it("saves call me / company / counties in Live", () => {
    assert.equal(applyCoachWrite("Call me Jordan", snap(), blankSurvive)?.profile?.goBy, "Jordan");
    assert.equal(applyCoachWrite("I work for North Ridge", snap(), blankSurvive)?.profile?.company, "North Ridge");
    assert.equal(
      applyCoachWrite("My counties are Dauphin, Perry, Cumberland", snap(), blankSurvive)?.profile?.counties,
      "Dauphin, Perry, Cumberland",
    );
    assert.equal(applyCoachWrite("My state is PA", snap(), blankSurvive)?.profile?.states, "PA");
  });
  it("still fills the open Setup row first", () => {
    const a = applyCoachWrite("Jordan", snap(), blankSurvive, "you");
    assert.equal(a?.profile?.goBy, "Jordan");
  });
  it("does not invent a zip from chat", () => {
    assert.equal(applyCoachWrite("17068", snap(), blankSurvive, "zips"), null);
  });
});
