import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cardAsk,
  claimUnlocked,
  hatToMode,
  modeBrief,
  normalizeClaimStage,
  normalizeMode,
  normalizeScene,
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
    assert.match(roleplayKnockLine("none", "2004", "claim"), /claim-stage/);
    assert.doesNotMatch(roleplayKnockLine("none", "2004", "claim"), /Walk-up. I knock/);
  });
});

describe("claim scene", () => {
  it("normalizes claim and unknown stays walkup", () => {
    assert.equal(normalizeScene("claim"), "claim");
    assert.equal(normalizeScene("nope"), "walkup");
    assert.equal(normalizeClaimStage("denied"), "denied");
    assert.equal(normalizeClaimStage("busy"), "none");
  });
  it("brief is claim-stage after Keep and age-only when cold", () => {
    const hot = modeBrief("roleplay", "claim", "none", "2004", null, true);
    assert.match(hot, /CLAIM|claim-stage|Where are you at with insurance/i);
    assert.match(hot, /not promise a flip/i);
    const cold = modeBrief("roleplay", "claim", "none", "2004", null, false);
    assert.match(cold, /Stay on age/);
    assert.doesNotMatch(cold, /invent a second storm/);
    assert.match(cold, /Do not name hail/);
  });
  it("Keep gates the beat", () => {
    assert.equal(claimUnlocked([]), false);
    assert.equal(claimUnlocked([{ say: "kept" }]), true);
    assert.equal(claimUnlocked(0), false);
    assert.equal(claimUnlocked(1), true);
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
  it("live brief sends the AAR form to Plan, not Today", () => {
    const live = modeBrief("live");
    assert.match(live, /After Action Report and tomorrow write on Plan/);
    assert.doesNotMatch(live, /on Truck and After/);
    assert.doesNotMatch(live, /AAR lives on Truck/);
  });
});

describe("walk scene", () => {
  it("is buying questions before Set", () => {
    assert.equal(normalizeScene("walk"), "walk");
    assert.match(modeBrief("roleplay", "walk"), /buying questions/i);
    assert.match(modeBrief("roleplay", "walk"), /not dump a pitch|Walk the/i);
    assert.match(roleplayKnockLine("spouse", "2004", "walk"), /walk the house/i);
    assert.deepEqual(cardAsk("i35"), { mode: "roleplay", scene: "after" });
    assert.deepEqual(cardAsk("set"), { mode: "roleplay", scene: "set" });
  });
});

describe("phone scene", () => {
  it("is a call after photos and does not send SMS", () => {
    assert.equal(normalizeScene("phone"), "phone");
    assert.match(modeBrief("roleplay", "phone"), /phone review/i);
    assert.match(modeBrief("roleplay", "phone"), /does not send SMS|not text you from this chat/i);
    assert.match(roleplayKnockLine("spouse", "2005", "phone"), /phone review/i);
    assert.deepEqual(cardAsk("set"), { mode: "roleplay", scene: "set" });
  });
});

describe("cardAsk", () => {
  it("opens Roleplay on porch cards and Mindset on Compass", () => {
    assert.deepEqual(cardAsk("door"), { mode: "roleplay", scene: "walkup" });
    assert.deepEqual(cardAsk("claim"), { mode: "roleplay", scene: "claim" });
    assert.deepEqual(cardAsk("i35"), { mode: "roleplay", scene: "after" });
    assert.deepEqual(cardAsk("compass"), { mode: "mindset" });
  });
});
