import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blankReminderPrefs, reminderDue } from "./reminders.ts";
import { setupSnap, type SetupSnap } from "./setup-progress.ts";
import type { SurviveState } from "./survive-store.ts";

const survive = {
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

function emptySnap(): SetupSnap {
  return setupSnap({
    goBy: "",
    profileCompany: "",
    settingsCompany: "Roofus",
    counties: "",
    states: "",
    knockWindow: "",
    paperWindow: "",
    hardStop: "",
    warranty: "",
    zipCount: 0,
    survive,
  });
}

describe("reminderDue", () => {
  const prefs = blankReminderPrefs();
  const extra = { afterAction: "", stormFetchedOn: "", stackMonth: "" };

  it("nags setup until counties are in", () => {
    assert.equal(reminderDue("setup", prefs, "2026-09-10", emptySnap(), extra), true);
    const ready = setupSnap({
      goBy: "P",
      profileCompany: "R",
      settingsCompany: "R",
      counties: "Dauphin",
      states: "PA",
      knockWindow: "",
      paperWindow: "",
      hardStop: "",
      warranty: "",
      zipCount: 0,
      survive,
    });
    assert.equal(reminderDue("setup", prefs, "2026-09-10", ready, extra), false);
  });

  it("nags journal until the After Action Report is written", () => {
    assert.equal(reminderDue("journal", prefs, "2026-09-10", emptySnap(), extra), true);
    assert.equal(
      reminderDue("journal", prefs, "2026-09-10", emptySnap(), { ...extra, afterAction: "Wins: one set" }),
      false,
    );
  });
});
