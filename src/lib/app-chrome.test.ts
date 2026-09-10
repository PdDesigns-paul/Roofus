import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpPageFor, showBackHome } from "./app-chrome.ts";

describe("showBackHome", () => {
  it("hides Back and Home on the porch and the three tabs", () => {
    assert.equal(showBackHome("/"), false);
    assert.equal(showBackHome("/today"), false);
    assert.equal(showBackHome("/streets"), false);
    assert.equal(showBackHome("/coach/inspect"), false);
  });

  it("shows them on nested pages", () => {
    assert.equal(showBackHome("/settings"), true);
    assert.equal(showBackHome("/coach/cards"), true);
    assert.equal(showBackHome("/coach/reference"), true);
  });
});

describe("helpPageFor", () => {
  it("maps the path to the ? copy", () => {
    assert.equal(helpPageFor("/"), "home");
    assert.equal(helpPageFor("/today"), "today");
    assert.equal(helpPageFor("/streets"), "streets");
    assert.equal(helpPageFor("/coach/inspect"), "inspect");
    assert.equal(helpPageFor("/settings"), "settings");
    assert.equal(helpPageFor("/coach/cards"), "cards");
  });
});
