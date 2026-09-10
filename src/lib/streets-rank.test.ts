import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loopAge, loopLabel } from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";

function loop(p: Partial<StreetLoop> = {}): StreetLoop {
  return {
    id: "l1",
    title: "Oak Hills",
    streets: ["Oak St"],
    county: "Cumberland",
    state: "PA",
    medianYear: 2005,
    homes: 40,
    lat: 40.2,
    lon: -76.9,
    status: "fresh",
    lastResult: "",
    ...p,
  };
}

describe("loopLabel", () => {
  it("prefers a real subdivision name", () => {
    assert.equal(loopLabel(loop()), "Oak Hills");
  });
  it("falls back to the first road, not a fake title", () => {
    assert.equal(loopLabel(loop({ title: "  ", streets: ["Maple Ave"] })), "Near Maple Ave");
  });
  it("does not invent a name when the map has none", () => {
    assert.equal(loopLabel(loop({ title: "", streets: [] })), "Untitled streets");
  });
});

describe("loopAge", () => {
  it("is now minus median year", () => {
    assert.equal(loopAge(loop({ medianYear: 2006 }), 2026), 20);
  });
  it("does not go negative", () => {
    assert.equal(loopAge(loop({ medianYear: 2030 }), 2026), 0);
  });
});
