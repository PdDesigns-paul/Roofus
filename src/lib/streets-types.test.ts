import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampAgeBand,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  isLegacyAgeDefault,
  parseAgeDraft,
} from "./streets-types.ts";

describe("default age band", () => {
  it("is 15–22", () => {
    assert.equal(DEFAULT_AGE_MIN, 15);
    assert.equal(DEFAULT_AGE_MAX, 22);
  });
});

describe("parseAgeDraft", () => {
  it("keeps the first digit of 15 so clamp can wait for blur", () => {
    assert.equal(parseAgeDraft("1", 15), 1);
    assert.equal(parseAgeDraft("15", 17), 15);
  });
  it("falls back on blank or junk", () => {
    assert.equal(parseAgeDraft("", 22), 22);
    assert.equal(parseAgeDraft("  ", 15), 15);
    assert.equal(parseAgeDraft("ab", 15), 15);
  });
});

describe("clampAgeBand", () => {
  it("does not run until we have a number — 1 becomes 10 only here", () => {
    assert.deepEqual(clampAgeBand(1, 22), { ageMin: 10, ageMax: 22 });
  });
  it("keeps 15–22", () => {
    assert.deepEqual(clampAgeBand(15, 22), { ageMin: 15, ageMax: 22 });
  });
  it("lifts To when it is below From", () => {
    assert.deepEqual(clampAgeBand(20, 12), { ageMin: 20, ageMax: 20 });
  });
});

describe("isLegacyAgeDefault", () => {
  it("names the old 17–25 so a saved phone can move", () => {
    assert.equal(isLegacyAgeDefault(17, 25), true);
    assert.equal(isLegacyAgeDefault(15, 22), false);
    assert.equal(isLegacyAgeDefault(20, 30), false);
  });
});
