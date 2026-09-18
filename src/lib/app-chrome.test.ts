import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { helpPageFor, hideTalk, showBack } from "./app-chrome.ts";
import { HELP_ID_ALIAS, PAGE_HELP } from "./page-help.ts";

describe("showBack", () => {
  it("hides Back on the four Places", () => {
    assert.equal(showBack("/"), false);
    assert.equal(showBack("/truck"), false);
    assert.equal(showBack("/today"), false);
    assert.equal(showBack("/door"), false);
    assert.equal(showBack("/roof"), false);
    assert.equal(showBack("/after"), false);
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
    assert.equal(helpPageFor("/after"), "plan");
    assert.equal(helpPageFor("/streets"), "plan");
    assert.equal(helpPageFor("/roof"), "roof");
    assert.equal(helpPageFor("/coach/inspect"), "roof");
    assert.equal(PAGE_HELP.roof.title, "Roof");
    assert.match(PAGE_HELP.plan.body.join(" "), /After Action Report/);
    assert.match(PAGE_HELP.plan.body.join(" "), /Settings is a Go at the bottom/);
    assert.match(PAGE_HELP.plan.body.join(" "), /Morning/);
    assert.match(PAGE_HELP.plan.body.join(" "), /Finish the day owns the night form/);
    assert.equal(PAGE_HELP.today.title, "Today");
    assert.equal(PAGE_HELP.plan.title, "Plan");
    assert.match(PAGE_HELP.plan.body.join(" "), /Keep \/ Toss lives here/);
    assert.match(PAGE_HELP.today.body.join(" "), /Night opens Finish the day on Plan/);
    assert.match(PAGE_HELP.today.body.join(" "), /No Keep \/ Toss on Today/);
    assert.match(PAGE_HELP.today.body.join(" "), /No After Action Report fields here/);
    assert.match(PAGE_HELP.today.body.join(" "), /opens the house editor here/);
    assert.match(PAGE_HELP.today.body.join(" "), /Pin status writes the matching Today count once/);
    assert.match(PAGE_HELP.roof.body.join(" "), /Ticks hang on the open pin/);
    assert.match(PAGE_HELP.roof.body.join(" "), /No pin, no “this house.”/);
    assert.match(PAGE_HELP.today.body.join(" "), /five job slides over the field log/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /Go to Prep/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /filled Do/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /No Wins \/ Better \/ Plan textareas/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /Full pin board lives on Prep/);
    assert.doesNotMatch(PAGE_HELP.today.body.join(" "), /on Truck and After/);
    assert.ok(!("home" in PAGE_HELP));
    assert.match(PAGE_HELP.settings.body.join(" "), /Show the tour plays the five job slides again/);
    assert.match(PAGE_HELP.settings.body.join(" "), /title, hint, chevron/);
    assert.match(PAGE_HELP.settings.body.join(" "), /outlined pills under the list/);
    assert.doesNotMatch(PAGE_HELP.settings.body.join(" "), /Tour and sample day stay on this list/);
    assert.doesNotMatch(PAGE_HELP.settings.body.join(" "), /question-mark tour/);
    assert.match(PAGE_HELP.mindset.body.join(" "), /After Action Report lives on Plan/);
    assert.doesNotMatch(PAGE_HELP.mindset.body.join(" "), /on Truck and After/);
    assert.match(PAGE_HELP.door.body.join(" "), /Claim path/);
    assert.equal(helpPageFor("/settings/you"), "settings");
    assert.equal(helpPageFor("/settings/mindset"), "settings");
    assert.equal(helpPageFor("/door"), "door");
    assert.equal(helpPageFor("/coach/cards"), "door");
    assert.ok(!("streets" in PAGE_HELP));
    assert.ok(!("cards" in PAGE_HELP));
    assert.equal(HELP_ID_ALIAS.streets, "plan");
    assert.equal(HELP_ID_ALIAS.cards, "door");
  });
});
