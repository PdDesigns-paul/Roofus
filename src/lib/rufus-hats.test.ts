import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hatById, normalizeHat, roleplayKnockLine, RUFUS_HATS } from "./rufus-hats.ts";

describe("normalizeHat", () => {
  it("maps the old Score hat onto Roleplay", () => {
    assert.equal(normalizeHat("score"), "roleplay");
  });
  it("keeps known hats", () => {
    assert.equal(normalizeHat("mindset"), "mindset");
    assert.equal(normalizeHat("door"), "door");
  });
  it("falls back to Door", () => {
    assert.equal(normalizeHat("nope"), "door");
    assert.equal(normalizeHat(undefined), "door");
  });
});

describe("hatById", () => {
  it("does not leave a Score chip", () => {
    assert.equal(
      RUFUS_HATS.some((h) => (h.id as string) === "score"),
      false,
    );
    assert.equal(hatById("score").id, "roleplay");
    assert.equal(hatById("mindset").label, "Mindset");
  });
});

describe("roleplayKnockLine", () => {
  it("names who they are and the year", () => {
    assert.equal(
      roleplayKnockLine("busy", "2004"),
      "Be a polite busy owner with a 2004 roof. I knock.",
    );
  });
  it("knocks without a year", () => {
    assert.equal(roleplayKnockLine("spouse", "  "), "Be a spouse who is not the decision maker. I knock.");
  });
});
