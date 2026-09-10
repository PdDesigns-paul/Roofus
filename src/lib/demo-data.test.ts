import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEMO_COUNTIES, DEMO_LOOPS, demoHasPerry } from "./demo-loops.ts";
import { groupLoopsByCounty, groupLoopsByTownship, loopHeadline } from "./streets-rank.ts";

describe("sample day", () => {
  it("includes Perry County as its own group with park-once cards", () => {
    assert.match(DEMO_COUNTIES, /Perry/);
    assert.equal(demoHasPerry(), true);
    const perry = groupLoopsByCounty(DEMO_LOOPS).find((g) => /perry/i.test(g.county));
    assert.ok(perry);
    assert.ok(perry.loops.length >= 3);
    assert.equal(loopHeadline(perry.loops[0]!), "Main St / High St · 17068");
  });
  it("splits Hampden into more than one loop", () => {
    const groups = groupLoopsByTownship(DEMO_LOOPS);
    const cumb = groups.find((g) => /cumberland/i.test(g.county));
    const hampden = cumb?.townships.find((t) => /hampden/i.test(t.township));
    assert.ok(hampden);
    assert.ok(hampden.loops.length >= 2);
    assert.ok(hampden.loops.every((l) => l.homes <= 150));
  });
  it("is a generic canvasser, not a named office or a Drive subdivision dump", () => {
    assert.doesNotMatch(DEMO_COUNTIES, /Alpha|West Shore|PAHIC/i);
    const blob = JSON.stringify(DEMO_LOOPS);
    assert.doesNotMatch(blob, /Hampden Summit|Whelan Crossing|Ginger Fields|Autumn Ridge|Skyline View/i);
  });
});
