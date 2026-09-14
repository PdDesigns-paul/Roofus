import "./test-setup.ts";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PAGE_HELP } from "./page-help.ts";
import {
  isOnboardDone,
  markOnboardDone,
  ONBOARD_KEY,
  ONBOARD_STEPS,
  resetOnboard,
  subscribeOnboard,
} from "./onboard.ts";

const coachPrompt = readFileSync(new URL("./coach-prompt.ts", import.meta.url), "utf8");

describe("onboard", () => {
  it("starts undone and marks done on this phone", () => {
    localStorage.removeItem(ONBOARD_KEY);
    assert.equal(isOnboardDone(), false);
    markOnboardDone();
    assert.equal(isOnboardDone(), true);
    assert.equal(localStorage.getItem(ONBOARD_KEY), "1");
  });

  it("reset notifies so the tour can run again", () => {
    markOnboardDone();
    let hits = 0;
    const off = subscribeOnboard(() => {
      hits += 1;
    });
    resetOnboard();
    assert.equal(isOnboardDone(), false);
    assert.equal(hits, 1);
    off();
    resetOnboard();
    assert.equal(hits, 1);
  });

  it("is five job slides, not chrome dots or dead Place names", () => {
    assert.equal(ONBOARD_STEPS.length, 5);
    assert.deepEqual(
      ONBOARD_STEPS.map((s) => s.id),
      ["places", "door", "roof", "roofus", "age"],
    );
    const blob = ONBOARD_STEPS.map((s) => `${s.title} ${s.body}`).join(" ");
    assert.match(blob, /Truck · Door · Roof · Prep/);
    assert.match(blob, /Prep is night-before and morning/);
    assert.match(blob, /age and a free look/);
    assert.match(blob, /Walk this house, then this shot/);
    assert.match(blob, /Hold starts Live/);
    assert.match(blob, /Name weather only if you Kept it/);
    assert.doesNotMatch(blob, /\bInspect\b/);
    assert.doesNotMatch(blob, /\bPresets\b/);
    assert.doesNotMatch(blob, /\bStreets\b/);
    assert.doesNotMatch(blob, /Script A/);
    assert.doesNotMatch(blob, /Home Screen/);
    assert.equal("sample" in ONBOARD_STEPS[4] && ONBOARD_STEPS[4].sample, true);
    assert.equal("sample" in ONBOARD_STEPS[0], false);
  });
});

describe("tour copy in the book", () => {
  it("help and the coach name the five-slide sheet", () => {
    const settings = PAGE_HELP.settings.body.join(" ");
    assert.match(settings, /Show the tour plays the five slides again/);
    assert.doesNotMatch(settings, /question-mark tour/);
    assert.match(coachPrompt, /five slides over Truck/);
    assert.match(coachPrompt, /Skip is on every slide/);
    assert.doesNotMatch(coachPrompt, /does not auto-play/);
  });
});
