import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PEST_PACK, ROOFUS_PACK, SOLAR_PACK } from "./tenant/index.ts";

const kernelSrc = readFileSync(new URL("./coach-prompt.ts", import.meta.url), "utf8");

function cardText(p: typeof SOLAR_PACK | typeof PEST_PACK | typeof ROOFUS_PACK, id: string): string {
  const card = p.cards.find((c) => c.id === id);
  assert.ok(card, `${p.id} missing card ${id}`);
  return card.lines.map((l) => `${l.say ?? ""} ${l.note ?? ""}`).join(" ");
}

describe("VP-3 kernel honesty", () => {
  it("kernel doctrine: 429, never the utility, no waiver, no 30% on a 2026 owner-buy", () => {
    assert.match(kernelSrc, /16 CFR 429/);
    assert.match(kernelSrc, /third business day/);
    assert.match(kernelSrc, /Never coach a waiver/);
    assert.match(kernelSrc, /Never claim to be the utility/);
    assert.match(kernelSrc, /30% federal ITC on a 2026 owner-buy/);
    assert.match(kernelSrc, /chemical/);
    assert.match(kernelSrc, /mix rate/);
    assert.match(kernelSrc, /infestation/);
    assert.match(kernelSrc, /Mrs\. Jones next door/);
    assert.match(kernelSrc, /shop packet/);
    assert.match(kernelSrc, /Five types/);
    assert.doesNotMatch(kernelSrc, /hail/i);
  });

  it("kernel-off pack: roleplay 'can they back out?' cannot invent a waiver", () => {
    for (const p of [SOLAR_PACK, PEST_PACK]) {
      const sys = `${kernelSrc}\n${p.promptModules}`;
      assert.match(sys, /16 CFR 429/);
      assert.match(sys, /Never coach a waiver/);
      assert.doesNotMatch(sys, /waive the three days/i);
      const blob = JSON.stringify(p);
      assert.doesNotMatch(blob, /waive the three days/i);
      assert.doesNotMatch(blob, /skip the cooling-off/i);
    }
  });

  it("kernel-off pack: solar 'do I get the 30%?' cannot say yes on a 2026 owner-buy", () => {
    const sys = `${kernelSrc}\n${SOLAR_PACK.promptModules}`;
    assert.match(sys, /Never invent kWh, a 30% federal ITC on a 2026 owner-buy/);
    const blob = JSON.stringify(SOLAR_PACK);
    assert.doesNotMatch(blob, /30% tax credit/i);
    assert.doesNotMatch(blob, /you get the credit/i);
    assert.doesNotMatch(blob, /federal credit on a 2026 owner-buy/i);
    assert.doesNotMatch(blob, /30% ITC/);
  });

  it("solar Compass includes the cooling-off beat", () => {
    const text = cardText(SOLAR_PACK, "compass");
    assert.match(text, /FTC 429/);
    assert.match(text, /Never coach a waiver/);
    assert.match(text, /Never the utility/);
    assert.match(text, /shop packet/);
    assert.equal(SOLAR_PACK.cards.find((c) => c.id === "compass")?.mode, "mindset");
  });

  it("pest Compass includes cooling-off and the shop label", () => {
    const text = cardText(PEST_PACK, "compass");
    assert.match(text, /FTC 429/);
    assert.match(text, /Never coach a waiver/);
    assert.match(text, /label \/ license/);
    assert.equal(PEST_PACK.cards.find((c) => c.id === "compass")?.mode, "mindset");
  });

  it("roofus Compass mentions cooling-off without losing storm voice", () => {
    const compass = ROOFUS_PACK.cards.find((c) => c.id === "compass")!;
    const text = cardText(ROOFUS_PACK, "compass");
    assert.match(text, /personal growth that pays/);
    assert.match(text, /Choose to care/);
    assert.match(text, /glad you get to work today/);
    assert.match(text, /Stack skills/);
    assert.match(text, /demon never/);
    assert.match(text, /three business days to cancel/);
    assert.match(text, /Never coach a waiver/);
    assert.equal(compass.mode, "mindset");
  });
});
