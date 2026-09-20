import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COACH_MODEL_CHEAP, COACH_MODEL_DEAR, modelFor } from "./coach-model.ts";
import { PRACTICE_PLAN_COPY, practiceUnlocked } from "./coach-modes.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

describe("modelFor", () => {
  it("Live, Mindset, and unknown default cheap", () => {
    assert.equal(modelFor("live"), COACH_MODEL_CHEAP);
    assert.equal(modelFor("mindset"), COACH_MODEL_CHEAP);
    assert.equal(modelFor(undefined), COACH_MODEL_CHEAP);
    assert.equal(modelFor("nope"), COACH_MODEL_CHEAP);
    assert.equal(modelFor("live", "setup"), COACH_MODEL_CHEAP);
    assert.equal(modelFor("live", "help"), COACH_MODEL_CHEAP);
    assert.equal(modelFor("live", "inspect"), COACH_MODEL_CHEAP);
  });

  it("Roleplay Knock and Score me are dear", () => {
    assert.equal(modelFor("roleplay"), COACH_MODEL_DEAR);
    assert.equal(modelFor("score"), COACH_MODEL_DEAR);
    assert.equal(modelFor("roleplay", "porch"), COACH_MODEL_DEAR);
  });

  it("coach payload and handler pick from modelFor, not a Settings picker", () => {
    assert.match(src("./coach-prompt.ts"), /modelFor\(/);
    assert.doesNotMatch(src("./coach-prompt.ts"), /model:\s*"grok-4\.5"/);
    assert.match(src("../routes/api/coach.ts"), /modelFor/);
    assert.doesNotMatch(src("../routes/settings.you.tsx"), /grok-4|model picker|Coach model/i);
    assert.doesNotMatch(src("../routes/settings.index.tsx"), /grok-4|model picker/i);
  });
});

describe("practiceUnlocked", () => {
  it("missing book is on; only explicit false locks", () => {
    assert.equal(practiceUnlocked(undefined), true);
    assert.equal(practiceUnlocked(true), true);
    assert.equal(practiceUnlocked(false), false);
    assert.equal(PRACTICE_PLAN_COPY, "Practice is on the plan.");
  });

  it("Knock, mic, and Score me reuse Claim-lock copy when practice is off", () => {
    assert.match(src("../components/roleplay-bar.tsx"), /practiceUnlocked/);
    assert.match(src("../components/roleplay-bar.tsx"), /PRACTICE_PLAN_COPY/);
    assert.match(src("../components/roleplay-mic.tsx"), /practiceUnlocked/);
    assert.match(src("../components/coach-chat.tsx"), /practiceUnlocked/);
    assert.match(src("../components/coach-chat.tsx"), /Score me/);
    assert.doesNotMatch(src("../components/hear-it.tsx"), /practiceOn|practiceUnlocked/);
    assert.match(src("../routes/door.tsx"), /Hear this line/);
    assert.match(src("../routes/door.tsx"), /practiceUnlocked/);
    assert.match(src("./roofus-talk.ts"), /PRACTICE_PLAN_COPY/);
  });
});
