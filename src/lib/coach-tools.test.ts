import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FAQS } from "./porch-faqs.ts";
import {
  coachToolDefs,
  getFaq,
  getKeptStorm,
  getMriCard,
  getSurvive,
  runCoachTool,
  runToolRound,
  toolsOnFor,
  TOOL_ROUND_CAP,
} from "./coach-tools.ts";
import { pack } from "./tenant/index.ts";
import type { BrandPack } from "./tenant/pack.ts";
import { todayWeatherLine } from "./tenant/pack.ts";


describe("get_kept_storm", () => {
  it("returns none when only Tossed rows are on the book", () => {
    const out = getKeptStorm({
      keptStorms: [{ zip: "17050", say: "hail on Oak", status: "tossed" }],
    });
    assert.deepEqual(out, { storms: "none" });
  });

  it("returns the Keep on 17050 when that zip is asked", () => {
    const out = getKeptStorm(
      {
        keptStorms: [
          { zip: "17050", say: "Kept: hail on Creekview", street: "Creekview", status: "keep" },
          { zip: "17404", say: "other keep", status: "keep" },
        ],
      },
      "17050",
    );
    assert.notEqual(out.storms, "none");
    if (out.storms === "none") return;
    assert.equal(out.storms.length, 1);
    assert.match(out.storms[0].say, /Creekview/);
    assert.equal(out.storms[0].zip, "17050");
  });
});

describe("get_faq", () => {
  it("hits the million-dollar starter FAQ", () => {
    const out = getFaq({ faqs: DEFAULT_FAQS }, "million-dollar");
    assert.ok("faqs" in out);
    if (!("faqs" in out)) return;
    assert.ok(out.faqs.some((f) => /million-dollar/i.test(f.q)));
  });
});

describe("get_mri_card", () => {
  it("returns the Blow-off look line from the allowlist", () => {
    const out = getMriCard("Blow-off vs a crease");
    assert.ok("look" in out);
    if (!("look" in out)) return;
    const look = out.look ?? "";
    assert.match(look, /crease|seal|wind/i);
    assert.equal(out.open, "Reference");
    assert.equal(out.title, "Blow-off vs a crease");
  });

  it("does not return Hail Damage, Part 8", () => {
    const out = getMriCard("Hail Damage, Part 8");
    assert.deepEqual(out, { error: "not-found", title: "Hail Damage, Part 8" });
  });
});

describe("get_survive", () => {
  it("leaves Why blank and invents no number", () => {
    const out = getSurvive({ surviveSnap: {} });
    assert.equal(out.whyRecap, "");
    assert.equal(out.earned, "");
    assert.doesNotMatch(JSON.stringify(out), /\$\d|100000|million/);
  });
});

describe("tool runner", () => {
  it("returns an error object for an unknown tool and does not throw", () => {
    assert.doesNotThrow(() => runCoachTool("browse_web", {}, {}));
    assert.deepEqual(runCoachTool("browse_web", {}, {}), { error: "not on the phone" });
  });

  it("does not execute a third tool request", () => {
    const third = runToolRound([{ name: "get_survive", arguments: {} }], {}, TOOL_ROUND_CAP);
    assert.equal(third.skipped, true);
    assert.deepEqual(third.executed, []);
    const first = runToolRound([{ name: "get_survive", arguments: {} }], {}, 0);
    assert.equal(first.skipped, false);
    assert.equal(first.executed.length, 1);
  });
});

describe("toolsOnFor", () => {
  it("stays off for vision and in-character Roleplay", () => {
    assert.equal(toolsOnFor({ imageDataUrl: "data:image/jpeg;base64,xx" }), false);
    assert.equal(
      toolsOnFor({ mode: "roleplay", messages: [{ role: "user", content: "Walk-up. I knock." }] }),
      false,
    );
    assert.equal(
      toolsOnFor({ mode: "roleplay", messages: [{ role: "user", content: "score me" }] }),
      true,
    );
    assert.equal(toolsOnFor({ mode: "live" }), true);
  });
});

function packOff(): BrandPack {
  return {
    ...pack,
    modules: { storms: false, claim: false, internachi: false, packets: true },
  };
}

describe("pack without storms", () => {
  it("does not mention hail", () => {
    const off = packOff();
    const line = todayWeatherLine("hail on Oak", "Kept: hail on Creekview", off);
    assert.equal(line, "Age first.");
    assert.doesNotMatch(line, /hail/i);
    const storm = getKeptStorm(
      { keptStorms: [{ zip: "17050", say: "hail on Oak", status: "keep" }] },
      "17050",
      off,
    );
    assert.deepEqual(storm, { storms: "none" });
    assert.doesNotMatch(JSON.stringify(storm), /hail/i);
    const mri = getMriCard("What a hit looks like", undefined, off);
    assert.deepEqual(mri, { error: "not on the phone" });
    assert.equal(
      coachToolDefs(off).some((d) => d.function.name === "get_kept_storm"),
      false,
    );
    assert.equal(
      coachToolDefs(off).some((d) => d.function.name === "get_mri_card"),
      false,
    );
    assert.equal(coachToolDefs(pack).some((d) => d.function.name === "get_kept_storm"), true);
  });
});
