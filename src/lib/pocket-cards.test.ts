import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CLAIM_PATH_CARD,
  claimOnStreet,
  doorList,
  doorStrip,
  fillPocketCard,
  fillSpoken,
  fillTokens,
  hasOpenToken,
  nextKnockDay,
  POCKET_CARDS,
  pocketKnowledge,
  preKnock,
  stripWeather,
  yearWindowPhrase,
} from "./pocket-cards.ts";

describe("POCKET_CARDS", () => {
  it("is the five printables", () => {
    assert.deepEqual(
      POCKET_CARDS.map((c) => c.id),
      ["door", "pushback", "i35", "set", "compass"],
    );
  });
  it("Door is the million-dollar script, not fake hail", () => {
    const door = POCKET_CARDS.find((c) => c.id === "door")!;
    const text = door.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /what’s been going on in the area/);
    assert.match(text, /first-roof age/);
    assert.match(text, /Script A only after Keep/);
    assert.doesNotMatch(text, /we’re working next door/);
  });
  it("i35 never puts WHY in the house", () => {
    const i35 = POCKET_CARDS.find((c) => c.id === "i35")!;
    const text = i35.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /Never WHY in the house/);
    assert.match(text, /Can you see this/);
    assert.equal(i35.mode, "roleplay");
    assert.equal(i35.scene, "after");
  });
  it("Compass stays off the porch", () => {
    const c = POCKET_CARDS.find((x) => x.id === "compass")!;
    assert.equal(c.mode, "mindset");
    assert.match(c.when, /Truck only/);
    assert.match(c.formula, /truck/i);
    assert.match(c.lines.map((l) => l.note).join(" "), /demon never/);
  });
  it("Set names paper, phone-review, and confirm — no send-text button", () => {
    const set = POCKET_CARDS.find((c) => c.id === "set")!;
    const text = set.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /claims how-to/);
    assert.match(text, /20–30 minute phone review/);
    assert.match(text, /Roofus does not send that text/);
    assert.doesNotMatch(text, /send SMS/i);
  });
  it("each card has a one-line formula from doctrine", () => {
    for (const c of POCKET_CARDS) {
      assert.ok(c.formula.trim());
      assert.doesNotMatch(c.formula, /\n/);
    }
    const door = POCKET_CARDS.find((c) => c.id === "door")!;
    assert.match(door.formula, /free look/i);
    assert.match(door.formula, /what year/i);
    const i35 = POCKET_CARDS.find((c) => c.id === "i35")!;
    assert.match(i35.formula, /Can you see this/);
    assert.doesNotMatch(i35.formula, /why/i);
    const set = POCKET_CARDS.find((c) => c.id === "set")!;
    assert.match(set.formula, /three options/i);
  });
});

describe("CLAIM_PATH_CARD / doorList", () => {
  it("hides A when there is no Keep", () => {
    assert.equal(
      doorList(false).some((c) => c.id === "claim"),
      false,
    );
  });
  it("shows A after Door when they Kept", () => {
    const ids = doorList(true).map((c) => c.id);
    assert.deepEqual(ids, ["door", "claim", "pushback", "i35", "set", "compass"]);
  });
  it("is claim-stage, matching zip, no invented hail", () => {
    const text = CLAIM_PATH_CARD.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(CLAIM_PATH_CARD.formula, /insurance/);
    assert.match(CLAIM_PATH_CARD.when, /Keep/);
    assert.match(text, /Where are you at with insurance/);
    assert.match(text, /comfortable with that/);
    assert.match(text, /Do not promise a flip/);
    assert.match(text, /every carrier pays/);
    assert.doesNotMatch(text, /hail/i);
    assert.equal(CLAIM_PATH_CARD.scene, "claim");
  });
});

describe("preKnock", () => {
  const base = {
    cluster: "",
    storm: "",
    goBy: "",
    company: "",
    knockWindow: "",
    hardStop: "",
    ageMin: 15,
    ageMax: 22,
    workingZip: "",
  };

  it("is age-only with placeholders when the day is empty", () => {
    const k = preKnock(base);
    assert.equal(k.zip, "Pick a zip on Prep");
    assert.equal(k.age, "Roofs 15–22");
    assert.match(k.weather, /Age only/);
    assert.match(k.script, /Million-dollar script/);
    assert.match(k.opener, /\[your name\]/);
    assert.match(k.opener, /\[company\]/);
  });
  it("uses Working zip and kept weather when they set them", () => {
    const k = preKnock({
      ...base,
      cluster: "17050",
      storm: "You may mention 1 inch hail in Camp Hill on this street.",
      goBy: "Pat",
      company: "Field Co",
      knockWindow: "after work",
      hardStop: "dark",
      workingZip: "17404",
    });
    assert.equal(k.zip, "17050");
    assert.match(k.weather, /Camp Hill/);
    assert.match(k.script, /this zip/);
    assert.match(k.hours, /after work/);
    assert.match(k.opener, /I’m Pat with Field Co/);
  });
  it("falls back to the Working zip when Neighborhood today is blank", () => {
    const k = preKnock({ ...base, workingZip: "17404" });
    assert.equal(k.zip, "17404");
  });
});

describe("pocketKnowledge", () => {
  it("feeds the coach the same cards plus Claim path", () => {
    const k = pocketKnowledge();
    assert.match(k, /### Door/);
    assert.match(k, /### Claim path/);
    assert.match(k, /### i35/);
    assert.match(k, /Formula: /);
    assert.match(k, /Never WHY/);
  });
});

const fill = {
  goBy: "Pat",
  company: "Field Co",
  ageMin: 15,
  ageMax: 22,
  day: "Thursday",
};

describe("fillTokens", () => {
  it("says I’m Pat with Field Co, not brackets", () => {
    const line =
      "Hey — I’m [name] with [company]. I stopped by to see if you heard what’s been going on in the area.";
    const out = fillTokens(line, fill);
    assert.match(out, /I’m Pat with Field Co/);
    assert.doesNotMatch(out, /\[name\]|\[company\]/);
  });
  it("fills year as the age-band window, never a guessed build year", () => {
    const line = "A lot of these houses are on the original roof from around [year]. That’s first-roof age.";
    const out = fillTokens(line, fill);
    assert.match(out, /that 15–22 year window/);
    assert.doesNotMatch(out, /\[year\]/);
    assert.doesNotMatch(out, /\b(19|20)\d{2}\b/);
    assert.equal(yearWindowPhrase(20, 30), "that 20–30 year window");
  });
  it("fills [day] with the weekday they passed", () => {
    assert.equal(fillTokens("Does [day] morning work?", fill), "Does Thursday morning work?");
  });
  it("leaves [name] when You is empty so Door can hide it", () => {
    const out = fillTokens("I’m [name] with [company].", {
      ...fill,
      goBy: "",
      company: "",
    });
    assert.match(out, /\[name\]/);
    assert.match(out, /\[company\]/);
    assert.equal(hasOpenToken(out), true);
  });
  it("keeps source templates unfilled so doctrine asserts still pass", () => {
    const door = POCKET_CARDS.find((c) => c.id === "door")!;
    assert.match(door.lines.map((l) => l.say ?? "").join(" "), /\[name\]/);
    assert.match(door.lines.map((l) => l.say ?? "").join(" "), /\[year\]/);
  });
});

describe("fillSpoken / fillPocketCard", () => {
  it("never leaves brackets, even on an empty book", () => {
    const out = fillSpoken("I’m [name] with [company] around [year] on [day].", {
      goBy: "",
      company: "",
      ageMin: 15,
      ageMax: 22,
      day: "Friday",
    });
    assert.doesNotMatch(out, /\[[^\]]+\]/);
    assert.match(out, /your name/);
    assert.match(out, /your company/);
    assert.match(out, /Friday/);
  });
  it("fills the Door card at render time", () => {
    const door = fillPocketCard(POCKET_CARDS.find((c) => c.id === "door")!, fill);
    const text = door.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /I’m Pat with Field Co/);
    assert.match(text, /that 15–22 year window/);
    assert.doesNotMatch(text, /\[name\]|\[year\]/);
  });
  it("fills Roleplay knowledge so practice does not say [name]", () => {
    const k = fillSpoken(pocketKnowledge(), fill);
    assert.match(k, /I’m Pat with Field Co/);
    assert.doesNotMatch(k, /\[name\]|\[company\]|\[year\]|\[day\]/);
  });
});

describe("nextKnockDay", () => {
  it("is tomorrow’s weekday from the local date", () => {
    assert.equal(nextKnockDay(new Date(2026, 8, 15, 12)), "Wednesday");
  });
});

describe("doorStrip", () => {
  it("names You, street, roofs, and weather", () => {
    const s = doorStrip({
      goBy: "Pat",
      company: "Field Co",
      streetName: "Oak Street",
      loopLabel: "Camp Hill · 17050",
      ageMin: 15,
      ageMax: 22,
      weather: "1 inch hail in Camp Hill",
    });
    assert.equal(s.emptyYou, false);
    assert.equal(s.identity, "Pat · Field Co");
    assert.equal(s.place, "Oak Street");
    assert.equal(s.placeGo, "/after");
    assert.equal(s.pinNeeded, false);
    assert.equal(s.age, "roofs 15–22");
    assert.match(s.weather, /Camp Hill/);
  });
  it("empty You and no street stay honest", () => {
    const s = doorStrip({
      goBy: "",
      company: "",
      streetName: "",
      loopLabel: "",
      ageMin: 15,
      ageMax: 22,
      weather: "",
    });
    assert.equal(s.emptyYou, true);
    assert.equal(s.pinNeeded, true);
    assert.equal(s.placeGo, "/truck");
    assert.equal(s.weather, "Age only");
  });
  it("falls back to the Working loop label when geocode is empty", () => {
    const s = doorStrip({
      goBy: "Pat",
      company: "Field Co",
      streetName: "",
      loopLabel: "Camp Hill · 17050",
      ageMin: 15,
      ageMax: 22,
      weather: "Age only",
    });
    assert.equal(s.place, "Camp Hill · 17050");
    assert.equal(s.placeGo, "/after");
  });
});

describe("claimOnStreet / stripWeather", () => {
  it("hides Script A when the zip is missing", () => {
    assert.equal(claimOnStreet([{ say: "1 inch hail", zip: "" }]).show, false);
    assert.equal(claimOnStreet([]).show, false);
  });
  it("names the kept storm and zip when they match", () => {
    const c = claimOnStreet([{ say: "1 inch hail in Camp Hill", zip: "17050" }]);
    assert.equal(c.show, true);
    assert.equal(c.when, "1 inch hail in Camp Hill · 17050");
  });
  it("weather is kept, then Use-today, then age-only", () => {
    assert.equal(stripWeather("1 inch hail", "Use today line"), "1 inch hail");
    assert.equal(stripWeather("", "Use today line\nmore"), "Use today line");
    assert.equal(stripWeather("", ""), "Age only");
  });
});
