import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POCKET_CARDS, pocketKnowledge, preKnock } from "./pocket-cards.ts";

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
    assert.match(c.lines.map((l) => l.note).join(" "), /demon never/);
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
    assert.equal(k.zip, "Pick a zip on After");
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
  it("feeds the coach the same five cards", () => {
    const k = pocketKnowledge();
    assert.match(k, /### Door/);
    assert.match(k, /### i35/);
    assert.match(k, /Never WHY/);
  });
});
