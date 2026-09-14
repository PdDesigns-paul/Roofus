import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mindsetKnowledge } from "./mindset.ts";
import { pocketKnowledge } from "./pocket-cards.ts";

describe("mindsetKnowledge", () => {
  it("is Survival, not pocket cards", () => {
    const k = mindsetKnowledge();
    assert.match(k, /personal growth that pays/);
    assert.doesNotMatch(k, /What.?s going on → original roofs/);
    assert.doesNotMatch(k, /I stopped by to see if you heard/);
  });
});

describe("pocketKnowledge still the porch appendix", () => {
  it("still contains the Door formula", () => {
    assert.match(pocketKnowledge(), /What.?s going on → original roofs/);
  });
});
