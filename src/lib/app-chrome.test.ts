import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpPageFor, hideTalk, showBack } from "./app-chrome.ts";
import { PAGE_HELP } from "./page-help.ts";

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

describe("hideTalk", () => {
  it("hides the dog on Roof, not on the other Places", () => {
    assert.equal(hideTalk("/roof"), true);
    assert.equal(hideTalk("/coach/inspect"), true);
    assert.equal(hideTalk("/truck"), false);
    assert.equal(hideTalk("/door"), false);
    assert.equal(hideTalk("/after"), false);
    assert.equal(hideTalk("/settings"), false);
  });
});

describe("helpPageFor", () => {
  it("maps the path to the ? copy", () => {
    assert.equal(helpPageFor("/"), "today");
    assert.equal(helpPageFor("/truck"), "today");
    assert.equal(helpPageFor("/today"), "today");
    assert.equal(helpPageFor("/after"), "streets");
    assert.equal(helpPageFor("/streets"), "streets");
    assert.equal(helpPageFor("/roof"), "roof");
    assert.equal(helpPageFor("/coach/inspect"), "roof");
    assert.equal(PAGE_HELP.roof.title, "Roof");
    assert.match(PAGE_HELP.streets.body.join(" "), /After Action Report/);
    assert.match(PAGE_HELP.streets.body.join(" "), /Settings is a Go at the bottom/);
    assert.match(PAGE_HELP.streets.body.join(" "), /Morning/);
    assert.match(PAGE_HELP.streets.body.join(" "), /Finish the day owns the night form/);
    assert.equal(PAGE_HELP.streets.title, "Prep");
    assert.match(PAGE_HELP.streets.body.join(" "), /Keep \/ Toss lives here/);
    assert.match(PAGE_HELP.today.body.join(" "), /Night is a Go to Prep/);
    assert.match(PAGE_HELP.today.body.join(" "), /No Keep \/ Toss on Truck/);
    assert.match(PAGE_HELP.today.body.join(" "), /No Wins \/ Better \/ Plan textareas here/);
    assert.match(PAGE_HELP.today.body.join(" "), /opens the house editor here/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /Full pin board lives on Prep/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /on Truck and After/);
    assert.match(PAGE_HELP.home.body.join(" "), /First open is five slides over Truck/);
    assert.match(PAGE_HELP.settings.body.join(" "), /Show the tour plays the five slides again/);
    assert.match(PAGE_HELP.settings.body.join(" "), /title, hint, chevron/);
    assert.match(PAGE_HELP.settings.body.join(" "), /outlined pills under the list/);
    assert.doesNotMatch(PAGE_HELP.settings.body.join(" "), /Tour and sample day stay on this list/);
    assert.doesNotMatch(PAGE_HELP.settings.body.join(" "), /question-mark tour/);
    assert.match(PAGE_HELP.mindset.body.join(" "), /After Action Report lives on Prep/);
    assert.doesNotMatch(PAGE_HELP.mindset.body.join(" "), /on Truck and After/);
    assert.match(PAGE_HELP.cards.body.join(" "), /Claim path/);
    assert.equal(helpPageFor("/settings/you"), "settings");
    assert.equal(helpPageFor("/settings/mindset"), "settings");
    assert.equal(helpPageFor("/door"), "cards");
    assert.equal(helpPageFor("/coach/cards"), "cards");
  });
});
