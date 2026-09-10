import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEMO_COUNTIES, DEMO_LOOPS, demoHasPerry } from "./demo-loops.ts";
import { groupLoopsByCounty, loopHeadline } from "./streets-rank.ts";

describe("sample day", () => {
  it("includes Perry County as its own group with town · zip cards", () => {
    assert.match(DEMO_COUNTIES, /Perry/);
    assert.equal(demoHasPerry(), true);
    const perry = groupLoopsByCounty(DEMO_LOOPS).find((g) => /perry/i.test(g.county));
    assert.ok(perry);
    assert.ok(perry.loops.length >= 3);
    assert.equal(loopHeadline(perry.loops[0]!), "New Bloomfield · 17068");
  });
  it("is a generic canvasser, not a named office", () => {
    assert.doesNotMatch(DEMO_COUNTIES, /Alpha|West Shore|PAHIC/i);
  });
});
