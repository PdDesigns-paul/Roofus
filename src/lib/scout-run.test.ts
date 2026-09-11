import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { targetYearsFromAge } from "./scout-types.ts";
import type { StormEvent } from "./weather-types.ts";
import {
  buildScoutCard,
  cardKeysLookClean,
  factsFromAdapterText,
  parseDamageNouns,
  parseQuotedSize,
  scoutCardMarkdown,
  shouldSkipScout,
  stripPii,
  textNamesCounty,
  type ScoutLoopInput,
} from "./scout-run.ts";

function loop(p: Partial<ScoutLoopInput> = {}): ScoutLoopInput {
  return {
    id: "oak",
    zip: "17011",
    place: "Oak St / Pine St",
    streets: ["Oak St", "Pine St"],
    county: "Cumberland",
    state: "PA",
    medianYear: 2005,
    lat: 40.24,
    lon: -76.92,
    status: "fresh",
    ...p,
  };
}

function storm(p: Partial<StormEvent> = {}): StormEvent {
  return {
    id: "s1",
    date: "2026-09-10",
    kind: "hail",
    county: "Cumberland",
    state: "PA",
    magnitude: "1.00",
    places: ["Camp Hill"],
    say: "1 inch hail in Camp Hill",
    source: "NWS Local Storm Report",
    lat: 40.24,
    lon: -76.92,
    remark: "1.00 inch hail",
    ...p,
  };
}

const BAND = targetYearsFromAge(17, 25, 2026);

describe("shouldSkipScout", () => {
  it("skips Skip / Hostile and does not scrape", () => {
    assert.equal(shouldSkipScout(loop({ status: "skip" }), BAND, 2026).skip, true);
    assert.equal(shouldSkipScout(loop({ status: "hostile" }), BAND, 2026).skip, true);
    assert.equal(shouldSkipScout(loop({ status: "fresh" }), BAND, 2026).skip, false);
  });

  it("skips age veto and leaves unknown years alone", () => {
    assert.equal(shouldSkipScout(loop({ medianYear: 2018 }), BAND, 2026).skip, true);
    assert.equal(shouldSkipScout(loop({ medianYear: 0 }), BAND, 2026).skip, false);
  });
});

describe("PII", () => {
  it("drops owner names, phones, parcels, and social URLs", () => {
    const raw =
      "Owner: Jane Doe parcel 12-34-5 call 717-555-0100 https://nextdoor.com/p/x 1.00 inch hail";
    const clean = stripPii(raw);
    assert.equal(/Jane/.test(clean), false);
    assert.equal(/717-555-0100/.test(clean), false);
    assert.equal(/12-34-5/.test(clean), false);
    assert.equal(/nextdoor/i.test(clean), false);
    assert.equal(parseQuotedSize(raw), "1.00 inch");
  });
});

describe("factsFromAdapterText", () => {
  it("adapter miss does not invent a size", () => {
    const miss = factsFromAdapterText("Welcome to the county GIS clicker.");
    assert.equal(miss.miss, true);
    assert.equal(miss.quotedSize, undefined);
    assert.equal(parseQuotedSize("some hail fell nearby"), "");
  });

  it("keeps a quoted size and tarp fatigue", () => {
    const hit = factsFromAdapterText("CTP PNS: 1.25 inch hail. Trees down. Blue tarps on Oak St.");
    assert.equal(hit.miss, false);
    assert.equal(hit.quotedSize, "1.25 inch");
    assert.ok(hit.damageNouns?.includes("tree"));
    assert.equal(hit.fatigue, "signs");
  });

  it("does not treat HTML chrome or street as damage", () => {
    const chrome = factsFromAdapterText(
      "<html>window[window['GoogleAnalyticsObject']] wireless forecast</html>",
    );
    assert.equal(chrome.miss, true);
    assert.equal(parseDamageNouns("Oak Street county GIS clicker").includes("tree"), false);
    assert.equal(parseDamageNouns("wireless update").includes("wire"), false);
  });

  it("does not tag a PNS that names another county", () => {
    assert.equal(
      textNamesCounty("Storm survey near Cyclone in McKean County.", "Cumberland"),
      false,
    );
    assert.equal(textNamesCounty("Hail in Cumberland County this afternoon.", "Cumberland"), true);
    const other = factsFromAdapterText(
      "Preliminary storm survey scheduled for McKean County. Possible damage may be surveyed.",
    );
    assert.equal(other.miss, true);
  });
});

describe("buildScoutCard", () => {
  it("counts an in-county LSR and stays pending", () => {
    const card = buildScoutCard({
      loop: loop(),
      target: BAND,
      storms: [storm()],
      now: 2026,
      checkedAt: "2026-09-11T12:00:00.000Z",
    });
    assert.ok(card.lsrCount >= 1);
    assert.equal(card.keep, "pending");
    assert.equal(card.ageBand, "celebrate");
    assert.equal(card.meshMm, undefined);
    assert.equal(cardKeysLookClean(card), true);
  });

  it("does not tag a distant same-state report", () => {
    const card = buildScoutCard({
      loop: loop(),
      target: BAND,
      storms: [storm({ lat: 41.5, say: "hail near Wellsboro" })],
      now: 2026,
    });
    assert.equal(card.lsrCount, 0);
    assert.equal(card.stormBand, "quiet");
  });

  it("on Skip writes a card without scraping storms", () => {
    const card = buildScoutCard({
      loop: loop({ status: "skip" }),
      target: BAND,
      storms: [storm()],
      now: 2026,
    });
    assert.equal(card.lsrCount, 0);
    assert.equal(card.stormBand, "quiet");
    assert.equal(card.keep, "pending");
    assert.match(card.why, /does not scrape/);
  });

  it("adapter miss stays unknown — no guessed year or hail size", () => {
    const card = buildScoutCard({
      loop: loop({ medianYear: 0 }),
      target: BAND,
      storms: [],
      adapter: { miss: true },
      now: 2026,
    });
    assert.equal(card.ageBand, "unknown");
    assert.equal(card.censusYear, 0);
    assert.equal(card.stormSay, "");
    assert.equal(card.look, "unknown");
    assert.equal(card.permits, "unknown");
    assert.match(card.why, /Adapter miss/);
    assert.equal(card.stormSay.includes("1.5"), false);
  });

  it("does not auto-Skip from scrape output", () => {
    const card = buildScoutCard({
      loop: loop(),
      target: BAND,
      storms: [],
      adapter: factsFromAdapterText("1.00 inch hail. Trees down."),
      now: 2026,
    });
    assert.equal(card.keep, "pending");
    assert.notEqual(card.ageBand, "veto");
  });

  it("markdown has no owner PII and no porch sentence", () => {
    const card = buildScoutCard({ loop: loop(), target: BAND, storms: [storm()], now: 2026 });
    const md = scoutCardMarkdown(card);
    assert.equal(/owner|phone|parcel|resident/i.test(md), false);
    assert.equal(md.includes("You may mention"), false);
  });
});
