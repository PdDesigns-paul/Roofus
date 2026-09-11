import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dropKept,
  formatKeptSentence,
  freshKeptSentence,
  isFreshKept,
  keptAfterTap,
  keptFromLead,
  keptFromStorm,
  readFreshKept,
  upsertKept,
} from "./kept-storm.ts";
import { leadToStorm } from "./weather-grade.ts";
import { mentionOnStreet } from "./weather-match.ts";
import type { PulseLead, StormEvent } from "./weather-types.ts";

function lead(p: Partial<PulseLead> = {}): PulseLead {
  return {
    id: "p-s1",
    grade: "H",
    kind: "hail",
    date: "2026-09-08",
    county: "Cumberland",
    state: "PA",
    places: ["Camp Hill"],
    say: "1 inch hail in Camp Hill",
    why: "NWS on a loop you already keep",
    sources: ["NWS"],
    loopId: "oak",
    loopLabel: "Oak Hills · 17011",
    lat: 40.24,
    lon: -76.92,
    remark: "1.00 inch hail",
    ...p,
  };
}

function storm(p: Partial<StormEvent> = {}): StormEvent {
  return {
    id: "s1",
    date: "2026-09-08",
    kind: "hail",
    county: "Cumberland",
    state: "PA",
    magnitude: "1.00 in",
    places: ["Camp Hill"],
    say: "1 inch hail in Camp Hill",
    source: "NWS",
    lat: 40.24,
    lon: -76.92,
    remark: "1.00 inch hail",
    ...p,
  };
}

describe("keptAfterTap", () => {
  it("Keep writes a row; Skip and Toss do not", () => {
    const row = keptFromLead(lead());
    assert.equal(keptAfterTap("keep", row)?.say, row.say);
    assert.equal(keptAfterTap("skip", row), null);
    assert.equal(keptAfterTap("toss", row), null);
  });
});

describe("freshKeptSentence", () => {
  it("names only the storm they Kept", () => {
    const row = keptFromLead(lead(), "2026-09-10T18:14:00.000Z");
    const line = formatKeptSentence(row);
    assert.match(line, /^Kept: 1 inch hail in Camp Hill · Oak Hills · 17011 · /);
    assert.doesNotMatch(line, /York|2 High|invent/i);
  });
  it("keptAt 49 hours ago does not render", () => {
    const ago49 = new Date(Date.now() - 49 * 3600 * 1000).toISOString();
    const row = keptFromLead(lead(), ago49);
    assert.equal(isFreshKept(row), false);
    assert.equal(freshKeptSentence([row]), "");
    assert.deepEqual(readFreshKept([row]), []);
  });
  it("a Keep from an hour ago still renders", () => {
    const ago1 = new Date(Date.now() - 3600 * 1000).toISOString();
    const row = keptFromLead(lead(), ago1);
    assert.equal(isFreshKept(row), true);
    assert.match(freshKeptSentence([row]), /^Kept: 1 inch hail in Camp Hill/);
  });
  it("falls back to street when the lead has no loop", () => {
    const row = keptFromStorm(storm());
    assert.match(formatKeptSentence(row), /Camp Hill/);
    assert.doesNotMatch(formatKeptSentence(row), /Oak Hills/);
  });
});

describe("upsertKept", () => {
  it("replaces the same say + loop instead of stacking", () => {
    const first = keptFromLead(lead(), "2026-09-10T10:00:00.000Z");
    const second = keptFromLead(lead(), "2026-09-10T11:00:00.000Z");
    const rows = upsertKept([first], second);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.keptAt, second.keptAt);
  });
  it("dropKept removes Toss / Skip of that lead", () => {
    const row = keptFromLead(lead());
    assert.deepEqual(dropKept([row], row), []);
  });
});

describe("Script A still needs a matching loop", () => {
  it("coach can see the kept row while Script A stays gated", () => {
    const row = keptFromLead(lead());
    assert.ok(isFreshKept(row));
    assert.match(formatKeptSentence(row), /1 inch hail in Camp Hill/);
    const events = [leadToStorm(lead())];
    const near = { county: "Cumberland County", lat: 40.24, lon: -76.92 };
    const far = { county: "York", lat: 40.24, lon: -76.92 };
    assert.match(mentionOnStreet(events, near), /You may mention 1 inch hail in Camp Hill/);
    assert.equal(mentionOnStreet(events, far), "");
  });
});
