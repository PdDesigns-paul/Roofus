import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpPageFor, showBack } from "./app-chrome.ts";

describe("showBack", () => {
  it("hides Back on the three tabs", () => {
    assert.equal(showBack("/"), false);
    assert.equal(showBack("/today"), false);
    assert.equal(showBack("/coach/inspect"), false);
  });

  it("shows Back on nested pages, including Streets", () => {
    assert.equal(showBack("/streets"), true);
    assert.equal(showBack("/settings"), true);
    assert.equal(showBack("/coach/cards"), true);
    assert.equal(showBack("/coach/reference"), true);
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
