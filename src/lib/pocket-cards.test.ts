import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLAIM_PATH_CARD, doorList, POCKET_CARDS, pocketKnowledge, preKnock } from "./pocket-cards.ts";

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
