import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyWalk } from "../inspect-walk.ts";
import {
  DEFAULT_PACK_ID,
  DEMO_PACK,
  HOST_PACK,
  PEST_PACK,
  ROOFUS_PACK,
  SOLAR_PACK,
  manifestFromPack,
  pack,
  packById,
  resolvePack,
  resolvePackId,
} from "./index.ts";

function src(rel: string) {
  return readFileSync(new URL(rel, import.meta.url), "utf8");
}

const manifest = JSON.parse(
  readFileSync(new URL("../../../public/manifest.webmanifest", import.meta.url), "utf8"),
) as ReturnType<typeof manifestFromPack>;

const SOLAR_WALK = ["curb", "roof", "shade", "meter", "access"];

describe("resolvePackId", () => {
  it("VITE_TENANT_ID wins, then host, then roofus", () => {
    assert.equal(resolvePackId(), DEFAULT_PACK_ID);
    assert.equal(resolvePackId(""), "roofus");
    assert.equal(resolvePackId("nope"), "roofus");
    assert.equal(resolvePackId("solar"), "solar");
    assert.equal(resolvePackId("SOLAR"), "solar");
    assert.equal(resolvePackId("demo"), "solar");
    assert.equal(resolvePackId("DEMO"), "solar");
    assert.equal(resolvePackId("pest"), "pest");
    assert.equal(resolvePackId("PEST"), "pest");
    assert.equal(resolvePackId("", "roofus.coach"), "roofus");
    assert.equal(resolvePackId("", "www.roofus.coach:443"), "roofus");
    assert.equal(resolvePackId("", "app.other.com"), "roofus");
    assert.equal(resolvePackId("demo", "roofus.coach"), "solar");
    assert.equal(resolvePackId("solar", "roofus.coach"), "solar");
    assert.equal(HOST_PACK["roofus.coach"], "roofus");
    assert.equal(HOST_PACK["grok.me"], undefined);
  });

  it("CI default pack is roofus", () => {
    assert.equal(pack.id, "roofus");
    assert.equal(resolvePack(), ROOFUS_PACK);
    assert.equal(packById("roofus"), ROOFUS_PACK);
    assert.equal(packById("solar"), SOLAR_PACK);
    assert.equal(packById("demo"), SOLAR_PACK);
    assert.equal(packById("pest"), PEST_PACK);
    assert.equal(packById("nope"), ROOFUS_PACK);
    assert.equal(DEMO_PACK, SOLAR_PACK);
  });
});

describe("pack solar", () => {
  it("is a different shop: name, places, cards, inspect, labor", () => {
    assert.equal(SOLAR_PACK.id, "solar");
    assert.notEqual(SOLAR_PACK.productName, ROOFUS_PACK.productName);
    assert.equal(SOLAR_PACK.productName, "Stride");
    assert.notDeepEqual(SOLAR_PACK.places, ROOFUS_PACK.places);
    assert.equal(SOLAR_PACK.places.inspect, "Site");
    assert.equal(SOLAR_PACK.places.door, "Pitch");
    assert.equal(SOLAR_PACK.places.plan, "Route");
    assert.deepEqual(
      SOLAR_PACK.cards.map((c) => c.id),
      ["door", "pushback", "after", "set", "compass"],
    );
    assert.deepEqual(
      SOLAR_PACK.cards.map((c) => c.title),
      ["Opening", "Pushback", "Site / survey walk", "The set", "Compass"],
    );
    assert.equal(SOLAR_PACK.claimCard, undefined);
    assert.deepEqual(SOLAR_PACK.claimStages, []);
    assert.notDeepEqual(
      SOLAR_PACK.inspect.steps.map((s) => s.id),
      ROOFUS_PACK.inspect.steps.map((s) => s.id),
    );
    assert.deepEqual(SOLAR_PACK.inspect.steps.map((s) => s.id), SOLAR_WALK);
    assert.deepEqual(
      SOLAR_PACK.labor.units.map((u) => u.key),
      ["knocks", "talks", "looks", "sets"],
    );
    assert.deepEqual(
      SOLAR_PACK.labor.units.map((u) => u.label),
      ["Stops", "Talks", "Surveys", "Sets"],
    );
    assert.deepEqual(SOLAR_PACK.modules, { storms: false, claim: false, internachi: false, packets: true });
    assert.equal(SOLAR_PACK.copy.todayFallback, "Ask the four questions.");
  });

  it("Opening is four qualifiers, then a warm exit", () => {
    const door = SOLAR_PACK.cards.find((c) => c.id === "door")!;
    const text = door.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /own the home/i);
    assert.match(text, /electricity/i);
    assert.match(text, /How old is the roof/);
    assert.match(text, /decision-maker/);
    assert.match(text, /Renter \/ full shade \/ roof at end of life/);
    assert.match(text, /warm exit/);
    assert.match(SOLAR_PACK.promptModules, /four questions, then leave if no/);
  });

  it("does not say On the roof, Keep a storm first, or a golden 30%", () => {
    const blob = JSON.stringify(SOLAR_PACK);
    assert.doesNotMatch(blob, /On the roof/);
    assert.doesNotMatch(blob, /Keep a storm first/);
    assert.doesNotMatch(blob, /CompanyCam/);
    assert.doesNotMatch(blob, /Four slopes/);
    assert.doesNotMatch(blob, /Script A/);
    assert.doesNotMatch(blob, /Keep \/ Toss/);
    assert.doesNotMatch(blob, /hail/i);
    assert.doesNotMatch(blob, /we are the utility/i);
    assert.doesNotMatch(blob, /waive the three days/i);
    assert.doesNotMatch(blob, /30% tax credit/i);
    assert.doesNotMatch(blob, /you get the credit/i);
    assert.doesNotMatch(blob, /federal credit on a 2026 owner-buy/i);
    assert.doesNotMatch(blob, /30% ITC/);
    assert.doesNotMatch(blob, /sign now/i);
    assert.equal(
      SOLAR_PACK.labor.units.some((u) => /on the roof/i.test(u.label)),
      false,
    );
  });

  it("Compass and who-chips carry cooling-off and honest exits", () => {
    const compass = SOLAR_PACK.cards.find((c) => c.id === "compass")!;
    const text = compass.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /FTC 429/);
    assert.match(text, /Never coach a waiver/);
    assert.match(text, /Never the utility/);
    assert.match(text, /Credit lives in the shop packet/);
    assert.equal(compass.mode, "mindset");
    const who = SOLAR_PACK.who.map((w) => w.id);
    assert.deepEqual(who, ["busy", "spouse", "skeptic", "renter", "shade", "roofage", "scam", "lied"]);
    assert.ok(SOLAR_PACK.scenes.every((s) => !s.claim));
  });

  it("PWA fields come from the pack", () => {
    const roofus = manifestFromPack(ROOFUS_PACK);
    assert.equal(roofus.name, manifest.name);
    assert.equal(roofus.short_name, manifest.short_name);
    assert.equal(roofus.theme_color, manifest.theme_color);
    assert.equal(roofus.theme_color, ROOFUS_PACK.pwa.themeColor);
    const solar = manifestFromPack(SOLAR_PACK);
    assert.equal(solar.name, "Stride");
    assert.equal(solar.short_name, "Stride");
    assert.equal(solar.theme_color, SOLAR_PACK.pwa.themeColor);
    assert.notEqual(solar.theme_color, roofus.theme_color);
    const plugin = src("../../../scripts/pack-manifest-plugin.mjs");
    assert.match(plugin, /Stride/);
    assert.match(plugin, new RegExp(SOLAR_PACK.pwa.themeColor));
    assert.match(src("../../../.github/workflows/ci.yml"), /VITE_TENANT_ID: roofus/);
    assert.match(src("../../../.github/workflows/ci.yml"), /VITE_AUTH_ENABLED: "false"/);
    assert.doesNotMatch(src("../inspect-walk.ts"), /tenant\/index/);
    assert.match(src("../inspect-walk.ts"), /tenant\/solar\/inspect/);
    assert.match(src("../inspect-walk.ts"), /tenant\/pest\/inspect/);
    assert.match(src("../inspect-walk.ts"), /tenant\/roofus\/inspect/);
    assert.doesNotMatch(src("../inspect-walk.ts"), /tenant\/demo\/inspect/);
  });

  it("inspect walk rows follow VITE_TENANT_ID at call time", () => {
    const prev = process.env.VITE_TENANT_ID;
    try {
      process.env.VITE_TENANT_ID = "solar";
      assert.deepEqual(Object.keys(emptyWalk().done), SOLAR_WALK);
      process.env.VITE_TENANT_ID = "demo";
      assert.deepEqual(Object.keys(emptyWalk().done), SOLAR_WALK);
    } finally {
      if (prev === undefined) delete process.env.VITE_TENANT_ID;
      else process.env.VITE_TENANT_ID = prev;
    }
    assert.equal(emptyWalk().done.street, false);
  });
});

describe("pack pest", () => {
  it("is a different shop: name, places, cards, inspect, labor", () => {
    assert.equal(PEST_PACK.id, "pest");
    assert.equal(PEST_PACK.productName, "Stoop");
    assert.notEqual(PEST_PACK.productName, ROOFUS_PACK.productName);
    assert.notEqual(PEST_PACK.productName, SOLAR_PACK.productName);
    assert.deepEqual(PEST_PACK.places, { today: "Today", door: "Pitch", inspect: "Site", plan: "Route" });
    assert.deepEqual(PEST_PACK.modules, { storms: false, claim: false, internachi: false, packets: true });
    assert.deepEqual(
      PEST_PACK.cards.map((c) => c.id),
      ["door", "pushback", "after", "set", "compass"],
    );
    assert.deepEqual(
      PEST_PACK.cards.map((c) => c.title),
      ["Opening", "Pushback", "Site walk", "The start", "Compass"],
    );
    assert.equal(PEST_PACK.claimCard, undefined);
    assert.deepEqual(PEST_PACK.claimStages, []);
    assert.deepEqual(
      PEST_PACK.inspect.steps.map((s) => s.id),
      ["curb", "foundation", "eaves", "harbor", "access"],
    );
    assert.deepEqual(
      PEST_PACK.labor.units.map((u) => u.key),
      ["knocks", "talks", "looks", "sets"],
    );
    assert.deepEqual(
      PEST_PACK.labor.units.map((u) => u.label),
      ["Stops", "Talks", "Inspects", "Starts"],
    );
    assert.equal(PEST_PACK.copy.todayFallback, "Walk the foundation.");
  });

  it("does not say On the roof, Keep a storm first, or pest lies", () => {
    const blob = JSON.stringify(PEST_PACK);
    assert.doesNotMatch(blob, /On the roof/);
    assert.doesNotMatch(blob, /Keep a storm first/);
    assert.doesNotMatch(blob, /Keep \/ Toss/);
    assert.doesNotMatch(blob, /hail/i);
    assert.doesNotMatch(blob, /Script A/);
    assert.doesNotMatch(blob, /claim path/i);
    assert.doesNotMatch(blob, /Mrs\. Jones/);
    assert.doesNotMatch(blob, /we are the utility/i);
    assert.doesNotMatch(blob, /waive the three days/i);
    assert.doesNotMatch(blob, /mix rate/);
    assert.doesNotMatch(blob, /oz per gallon/);
    assert.doesNotMatch(blob, /safe for the dog/);
    assert.doesNotMatch(blob, /you have an infestation/i);
    assert.doesNotMatch(blob, /I can see termites from here/);
    assert.doesNotMatch(blob, /quarterly is a waste/i);
    assert.doesNotMatch(blob, /cancel their contract today/i);
    assert.doesNotMatch(blob, /sign now/i);
    assert.equal(
      PEST_PACK.labor.units.some((u) => /on the roof/i.test(u.label)),
      false,
    );
  });

  it("Compass and who-chips carry cooling-off and honest exits", () => {
    const compass = PEST_PACK.cards.find((c) => c.id === "compass")!;
    const text = compass.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
    assert.match(text, /FTC 429/);
    assert.match(text, /Never coach a waiver/);
    assert.match(text, /label \/ license/);
    assert.equal(compass.mode, "mindset");
    const who = PEST_PACK.who.map((w) => w.id);
    assert.deepEqual(who, ["busy", "spouse", "skeptic", "nope", "quarterly", "nobugs", "price", "card"]);
    assert.ok(PEST_PACK.scenes.every((s) => !s.claim));
  });

  it("inspect walk rows follow VITE_TENANT_ID at call time", () => {
    const prev = process.env.VITE_TENANT_ID;
    process.env.VITE_TENANT_ID = "pest";
    try {
      assert.deepEqual(Object.keys(emptyWalk().done), ["curb", "foundation", "eaves", "harbor", "access"]);
    } finally {
      if (prev === undefined) delete process.env.VITE_TENANT_ID;
      else process.env.VITE_TENANT_ID = prev;
    }
    assert.equal(emptyWalk().done.street, false);
  });
});
