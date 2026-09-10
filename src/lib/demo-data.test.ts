import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEMO_COUNTIES, DEMO_LOOPS, demoCountiesPresent } from "./demo-loops.ts";
import { groupLoopsByCounty, groupLoopsByTownship } from "./streets-rank.ts";
import { parseList, countyBasename } from "./us-state-fips.ts";

describe("sample day", () => {
  it("gives each sample county its own group with park-once cards", () => {
    assert.equal(demoCountiesPresent(), true);
    const groups = groupLoopsByCounty(DEMO_LOOPS);
    for (const name of parseList(DEMO_COUNTIES)) {
      const hit = groups.find((g) => countyBasename(g.county).toLowerCase() === name.toLowerCase());
      assert.ok(hit, name);
      assert.ok(hit.loops.length >= 1);
    }
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
