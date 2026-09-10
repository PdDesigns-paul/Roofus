import "./test-setup.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isOnboardDone, markOnboardDone, ONBOARD_KEY, resetOnboard, subscribeOnboard } from "./onboard.ts";

describe("onboard", () => {
  it("starts undone and marks done on this phone", () => {
    localStorage.removeItem(ONBOARD_KEY);
    assert.equal(isOnboardDone(), false);
    markOnboardDone();
    assert.equal(isOnboardDone(), true);
    assert.equal(localStorage.getItem(ONBOARD_KEY), "1");
  });

  it("reset notifies so the tour can run again", () => {
    markOnboardDone();
    let hits = 0;
    const off = subscribeOnboard(() => {
      hits += 1;
    });
    resetOnboard();
    assert.equal(isOnboardDone(), false);
    assert.equal(hits, 1);
    off();
    resetOnboard();
    assert.equal(hits, 1);
  });
});
