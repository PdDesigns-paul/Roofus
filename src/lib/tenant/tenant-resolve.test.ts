import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { emptyWalk } from "../inspect-walk.ts";
import {
  DEFAULT_PACK_ID,
  DEMO_PACK,
  HOST_PACK,
  ROOFUS_PACK,
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

describe("resolvePackId", () => {
  it("VITE_TENANT_ID wins, then host, then roofus", () => {
    assert.equal(resolvePackId(), DEFAULT_PACK_ID);
    assert.equal(resolvePackId(""), "roofus");
    assert.equal(resolvePackId("nope"), "roofus");
    assert.equal(resolvePackId("demo"), "demo");
    assert.equal(resolvePackId("DEMO"), "demo");
    assert.equal(resolvePackId("", "roofus.coach"), "roofus");
    assert.equal(resolvePackId("", "www.roofus.coach:443"), "roofus");
    assert.equal(resolvePackId("", "app.other.com"), "roofus");
    assert.equal(resolvePackId("demo", "roofus.coach"), "demo");
    assert.equal(HOST_PACK["roofus.coach"], "roofus");
    assert.equal(HOST_PACK["grok.me"], undefined);
  });

  it("CI default pack is roofus", () => {
    assert.equal(pack.id, "roofus");
    assert.equal(resolvePack(), ROOFUS_PACK);
    assert.equal(packById("roofus"), ROOFUS_PACK);
    assert.equal(packById("demo"), DEMO_PACK);
    assert.equal(packById("nope"), ROOFUS_PACK);
  });
});

describe("pack demo", () => {
  it("is a different shop: name, places, cards, inspect, labor", () => {
    assert.equal(DEMO_PACK.id, "demo");
    assert.notEqual(DEMO_PACK.productName, ROOFUS_PACK.productName);
    assert.equal(DEMO_PACK.productName, "Stride");
    assert.notDeepEqual(DEMO_PACK.places, ROOFUS_PACK.places);
    assert.equal(DEMO_PACK.places.inspect, "Site");
    assert.equal(DEMO_PACK.places.door, "Pitch");
    assert.equal(DEMO_PACK.places.plan, "Route");
    assert.notDeepEqual(
      DEMO_PACK.cards.map((c) => c.title),
      ROOFUS_PACK.cards.map((c) => c.title),
    );
    assert.notDeepEqual(
      DEMO_PACK.inspect.steps.map((s) => s.id),
      ROOFUS_PACK.inspect.steps.map((s) => s.id),
    );
    assert.notDeepEqual(
      DEMO_PACK.labor.units.map((u) => u.label),
      ROOFUS_PACK.labor.units.map((u) => u.label),
    );
    assert.deepEqual(
      DEMO_PACK.labor.units.map((u) => u.key),
      ["knocks", "talks", "looks", "sets"],
    );
    assert.deepEqual(DEMO_PACK.modules, { storms: false, claim: false, internachi: false, packets: true });
  });

  it("does not say On the roof or Keep a storm first", () => {
    const blob = JSON.stringify(DEMO_PACK);
    assert.doesNotMatch(blob, /On the roof/);
    assert.doesNotMatch(blob, /Keep a storm first/);
    assert.doesNotMatch(blob, /CompanyCam/);
    assert.doesNotMatch(blob, /Four slopes/);
    assert.doesNotMatch(blob, /Script A/);
    assert.equal(
      DEMO_PACK.labor.units.some((u) => /on the roof/i.test(u.label)),
      false,
    );
  });

  it("PWA fields come from the pack", () => {
    const roofus = manifestFromPack(ROOFUS_PACK);
    assert.equal(roofus.name, manifest.name);
    assert.equal(roofus.short_name, manifest.short_name);
    assert.equal(roofus.theme_color, manifest.theme_color);
    assert.equal(roofus.theme_color, ROOFUS_PACK.pwa.themeColor);
    const demo = manifestFromPack(DEMO_PACK);
    assert.equal(demo.name, "Stride");
    assert.equal(demo.short_name, "Stride");
    assert.equal(demo.theme_color, DEMO_PACK.pwa.themeColor);
    assert.notEqual(demo.theme_color, roofus.theme_color);
    const plugin = src("../../../scripts/pack-manifest-plugin.mjs");
    assert.match(plugin, /Stride/);
    assert.match(plugin, new RegExp(DEMO_PACK.pwa.themeColor));
    assert.match(src("../../../.github/workflows/ci.yml"), /VITE_TENANT_ID: roofus/);
    assert.match(src("../../../.github/workflows/ci.yml"), /VITE_AUTH_ENABLED: "false"/);
    assert.doesNotMatch(src("../inspect-walk.ts"), /tenant\/index/);
    assert.match(src("../inspect-walk.ts"), /tenant\/demo\/inspect/);
    assert.match(src("../inspect-walk.ts"), /tenant\/roofus\/inspect/);
  });

  it("inspect walk rows follow VITE_TENANT_ID at call time", () => {
    const prev = process.env.VITE_TENANT_ID;
    process.env.VITE_TENANT_ID = "demo";
    try {
      assert.deepEqual(Object.keys(emptyWalk().done), ["curb", "array", "inverter", "access"]);
    } finally {
      if (prev === undefined) delete process.env.VITE_TENANT_ID;
      else process.env.VITE_TENANT_ID = prev;
    }
    assert.equal(emptyWalk().done.street, false);
  });
});
