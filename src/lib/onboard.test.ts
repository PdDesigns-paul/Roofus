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
const overlay = readFileSync(new URL("../components/onboard-overlay.tsx", import.meta.url), "utf8");

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
      ["you", "house", "door", "dog", "age"],
    );
    const first = `${ONBOARD_STEPS[0].title} ${ONBOARD_STEPS[0].body}`;
    assert.doesNotMatch(first, /Truck · Door · Roof · Prep/);
    assert.doesNotMatch(first, /Today · Door · Roof · Plan/);
    assert.doesNotMatch(first, /Keep \/ Toss/);
    assert.doesNotMatch(first, /\bAAR\b/);
    assert.doesNotMatch(first, /Places/);
    assert.doesNotMatch(first, /filled Do/);
    assert.doesNotMatch(first, /Working loop/);
    const blob = ONBOARD_STEPS.map((s) => `${s.title} ${s.body}`).join(" ");
    assert.match(blob, /This log is yours/);
    assert.match(blob, /Tap Pin/);
    assert.match(blob, /age of the roof and a free look/);
    assert.match(blob, /Hold starts Live/);
    assert.match(blob, /Name weather only if you kept it/);
    assert.doesNotMatch(blob, /Prep is night-before and morning/);
    assert.doesNotMatch(blob, /\bInspect\b/);
    assert.doesNotMatch(blob, /\bPresets\b/);
    assert.doesNotMatch(blob, /\bStreets\b/);
    assert.doesNotMatch(blob, /Script A/);
    assert.doesNotMatch(blob, /Home Screen/);
    assert.equal("sample" in ONBOARD_STEPS[4] && ONBOARD_STEPS[4].sample, true);
    assert.equal("sample" in ONBOARD_STEPS[0], false);
  });

  it("shows the dog on the dog slide and sample day lands on Today", () => {
    assert.match(overlay, /current\.id === "dog"/);
    assert.match(overlay, /RoofusFace/);
    assert.match(overlay, /to: "\/truck"/);
    assert.doesNotMatch(overlay, /to: "\/after"/);
  });
});

describe("tour copy in the book", () => {
  it("help and the coach name the five job slides", () => {
    const settings = PAGE_HELP.settings.body.join(" ");
    const today = PAGE_HELP.today.body.join(" ");
    assert.match(settings, /Show the tour plays the five job slides again/);
    assert.match(settings, /outlined pills under the list/);
    assert.doesNotMatch(settings, /question-mark tour/);
    assert.match(today, /five job slides over the field log/);
    assert.match(today, /Do not list tab names on slide 1/);
    assert.match(coachPrompt, /five job slides over the field log/);
    assert.match(coachPrompt, /Do not list tab names on slide 1/);
    assert.match(coachPrompt, /Skip is on every slide/);
    assert.match(coachPrompt, /outlined pills under the list/);
    assert.match(coachPrompt, /Places: \$\{today\}, \$\{door\}, \$\{inspect\}, \$\{plan\}/);
    assert.doesNotMatch(coachPrompt, /does not auto-play/);
    assert.doesNotMatch(coachPrompt, /five slides over Truck/);
    assert.doesNotMatch(coachPrompt, /Places: Truck, Door, Roof, Prep/);
  });
});
