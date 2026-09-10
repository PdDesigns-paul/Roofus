import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countyBasename, fipsToAbbr, isMcdState, parseList, stateAbbr, stateFips } from "./us-state-fips.ts";

describe("stateFips / stateAbbr", () => {
  it("reads PA, Pennsylvania, and 42", () => {
    assert.equal(stateFips("PA"), "42");
    assert.equal(stateFips("Pennsylvania"), "42");
    assert.equal(stateAbbr("pennsylvania"), "PA");
    assert.equal(fipsToAbbr("42"), "PA");
  });
  it("rejects junk", () => {
    assert.equal(stateFips(""), null);
    assert.equal(stateAbbr("ZZ"), null);
  });
});

describe("parseList / countyBasename", () => {
  it("splits commas, slashes, and and", () => {
    assert.deepEqual(parseList("Cumberland, York and Dauphin"), ["Cumberland", "York", "Dauphin"]);
  });
  it("strips County / Co", () => {
    assert.equal(countyBasename("Cumberland County"), "Cumberland");
    assert.equal(countyBasename("York Co."), "York");
  });
});

describe("isMcdState", () => {
  it("treats PA as MCD and TX as CCD", () => {
    assert.equal(isMcdState("42"), true);
    assert.equal(isMcdState("PA"), false);
    assert.equal(isMcdState("48"), false);
  });
});
