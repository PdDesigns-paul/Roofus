import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PULL_BLOCK, pullArmed, pullOffset, scrollerAtTop } from "./pull-refresh.ts";

describe("pullOffset", () => {
  it("ignores an upward drag and caps the rubber band", () => {
    assert.equal(pullOffset(-12), 0);
    assert.equal(pullOffset(0), 0);
    assert.ok(pullOffset(80) > 20);
    assert.ok(pullOffset(80) < 80);
    assert.equal(pullOffset(400), 88);
  });
});

describe("pullArmed", () => {
  it("arms only after a real pull", () => {
    assert.equal(pullArmed(0), false);
    assert.equal(pullArmed(40), false);
    assert.equal(pullArmed(72), true);
  });
});

describe("scrollerAtTop", () => {
  it("blocks when the window has already scrolled", () => {
    assert.equal(scrollerAtTop(null, 40), false);
    assert.equal(scrollerAtTop(null, 0), true);
  });
});

describe("PULL_BLOCK", () => {
  it("leaves the map, fields, and sheets alone", () => {
    assert.match(PULL_BLOCK, /data-no-pull/);
    assert.match(PULL_BLOCK, /canvas/);
    assert.match(PULL_BLOCK, /dialog/);
  });
});

describe("pull does not blow the PWA", () => {
  it("revalidates in flight instead of location.reload", () => {
    const src = readFileSync(new URL("../components/pull-to-refresh.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(src, /location\.reload/);
    assert.match(src, /refreshInFlight/);
    const lib = readFileSync(new URL("./refresh-in-flight.ts", import.meta.url), "utf8");
    assert.match(lib, /location\.reload blows the PWA/);
    assert.match(lib, /refreshWeatherPulse/);
    assert.match(lib, /geocodeBlankPins/);
  });
});
