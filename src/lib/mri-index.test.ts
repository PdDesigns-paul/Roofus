import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { inspectKnowledge, inspectKnowledgeForShot, MRI_CHAPTERS, MRI_COUNT } from "./mri-index.ts";

describe("inspectKnowledge", () => {
  it("is the named cards, not Part N clones", () => {
    const k = inspectKnowledge();
    assert.match(k, /What a hit looks like/);
    assert.match(k, /Blow-off vs a crease/);
    assert.match(k, /Worn out vs hit/);
    assert.doesNotMatch(k, /Hail Damage, Part 8/);
    assert.doesNotMatch(k, /Asphalt Composition Shingles, Part 17/);
    assert.ok(k.length < 8000);
    const looks = [...k.matchAll(/^### .+\n(.+)\nOpen Reference:/gm)].map((m) => m[1]);
    assert.ok(looks.length > 0);
    assert.equal(new Set(looks).size, looks.length);
  });
});

describe("MRI_CHAPTERS catalog", () => {
  it("still has the Part-N cards for Reference", () => {
    const titles = MRI_CHAPTERS.flatMap((ch) => ch.cards.map((c) => c.title));
    assert.ok(titles.includes("Hail Damage, Part 8"));
    assert.ok(titles.includes("Asphalt Composition Shingles, Part 17"));
    assert.ok(MRI_COUNT > 100);
  });
});

describe("inspectKnowledgeForShot", () => {
  it("keeps hail, wind, and asphalt named cards, not the catalog", () => {
    const k = inspectKnowledgeForShot();
    assert.match(k, /### Hail/);
    assert.match(k, /### Wind/);
    assert.match(k, /### Asphalt walk/);
    assert.doesNotMatch(k, /### Slate/);
    assert.doesNotMatch(k, /Hail Damage, Part 8/);
    assert.ok(k.length < 4000);
  });
});
