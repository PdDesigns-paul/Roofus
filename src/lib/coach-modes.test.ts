import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cardAsk,
  hatToMode,
  modeBrief,
  normalizeMode,
  roleplayKnockLine,
  threadTag,
} from "./coach-modes.ts";

describe("normalizeMode", () => {
  it("maps old hats onto three modes", () => {
    assert.equal(hatToMode("score"), "roleplay");
    assert.equal(hatToMode("door"), "live");
    assert.equal(hatToMode("pushback"), "live");
    assert.equal(hatToMode("set"), "live");
    assert.equal(hatToMode("inspect"), "live");
    assert.equal(normalizeMode("roleplay"), "roleplay");
    assert.equal(normalizeMode("mindset"), "mindset");
    assert.equal(normalizeMode("nope"), "live");
    assert.equal(normalizeMode(undefined), "live");
  });
});

describe("roleplayKnockLine", () => {
  it("names who they are, the year, and the beat", () => {
    assert.equal(
      roleplayKnockLine("busy", "2004", "walkup"),
      "Be a polite busy owner with a 2004 roof. Walk-up. I knock.",
    );
    assert.match(roleplayKnockLine("spouse", "  ", "after"), /already showed them photos/);
    assert.match(roleplayKnockLine("skeptic", "2001", "visit"), /Whole visit/);
  });
});

describe("threadTag", () => {
  it("colors Live, Roleplay, Mindset, and keeps Roof", () => {
    assert.equal(threadTag({ mode: "live" }).label, "Live");
    assert.equal(threadTag({ mode: "roleplay" }).id, "roleplay");
    assert.equal(threadTag({ origin: "mindset", mode: "mindset" }).label, "Mindset");
    assert.equal(threadTag({ origin: "setup", mode: "live" }).label, "Setup");
    assert.equal(threadTag({ origin: "inspect", mode: "live" }).label, "Roof");
    assert.equal(threadTag({ hat: "door" }).label, "Live");
    assert.equal(threadTag({ hat: "score" }).label, "Roleplay");
  });
});

describe("modeBrief", () => {
  it("live never becomes the homeowner", () => {
    assert.match(modeBrief("live"), /not the homeowner/i);
    assert.match(modeBrief("live"), /Roof page/);
    assert.match(modeBrief("roleplay", "visit"), /WHOLE VISIT/);
    assert.match(modeBrief("mindset"), /Truck only/);
    assert.match(modeBrief("live", null, null, null, "setup"), /SETUP/);
  });
});

describe("cardAsk", () => {
  it("opens Roleplay on porch cards and Mindset on Compass", () => {
    assert.deepEqual(cardAsk("door"), { mode: "roleplay", scene: "walkup" });
    assert.deepEqual(cardAsk("claim"), { mode: "roleplay", scene: "walkup" });
    assert.deepEqual(cardAsk("i35"), { mode: "roleplay", scene: "after" });
    assert.deepEqual(cardAsk("compass"), { mode: "mindset" });
  });
});
