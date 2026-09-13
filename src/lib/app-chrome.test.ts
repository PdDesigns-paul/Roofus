import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpPageFor, showBack } from "./app-chrome.ts";

describe("showBack", () => {
  it("hides Back on the four Places", () => {
    assert.equal(showBack("/"), false);
    assert.equal(showBack("/truck"), false);
    assert.equal(showBack("/today"), false);
    assert.equal(showBack("/door"), false);
    assert.equal(showBack("/roof"), false);
    assert.equal(showBack("/after"), false);
    assert.equal(showBack("/coach/inspect"), false);
    assert.equal(showBack("/coach/cards"), false);
    assert.equal(showBack("/streets"), false);
  });

  it("shows Back on nested pages, including Settings and Reference", () => {
    assert.equal(showBack("/settings"), true);
    assert.equal(showBack("/settings/you"), true);
    assert.equal(showBack("/coach/reference"), true);
  });
});

describe("helpPageFor", () => {
  it("maps the path to the ? copy", () => {
    assert.equal(helpPageFor("/"), "today");
    assert.equal(helpPageFor("/truck"), "today");
    assert.equal(helpPageFor("/today"), "today");
    assert.equal(helpPageFor("/after"), "streets");
    assert.equal(helpPageFor("/streets"), "streets");
    assert.equal(helpPageFor("/roof"), "inspect");
    assert.equal(helpPageFor("/coach/inspect"), "inspect");
    assert.equal(helpPageFor("/settings"), "settings");
    assert.equal(helpPageFor("/settings/you"), "settings");
    assert.equal(helpPageFor("/settings/mindset"), "settings");
    assert.equal(helpPageFor("/door"), "cards");
    assert.equal(helpPageFor("/coach/cards"), "cards");
  });
});
