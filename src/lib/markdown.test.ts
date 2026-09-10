import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseBlocks, parseInline } from "./markdown.ts";

describe("parseInline", () => {
  it("bold, code, and a real link", () => {
    const bits = parseInline("Say **this** then `Duration` and [Warranty](https://northridge.example/w).");
    assert.deepEqual(
      bits.map((b) => b.t),
      ["text", "strong", "text", "code", "text", "link", "text"],
    );
    const link = bits.find((b) => b.t === "link");
    assert.equal(link && link.t === "link" ? link.href : "", "https://northridge.example/w");
    assert.equal(link && link.t === "link" ? link.v : "", "Warranty");
  });

  it("does not treat javascript as a link", () => {
    const bits = parseInline("[x](javascript:alert(1))");
    assert.equal(bits.some((b) => b.t === "link"), false);
  });

  it("turns a bare https URL into a link", () => {
    const bits = parseInline("Open https://northridge.example/warranty now.");
    const link = bits.find((b) => b.t === "link");
    assert.equal(link && link.t === "link" ? link.href : "", "https://northridge.example/warranty");
  });
});

describe("parseBlocks", () => {
  it("keeps a lead-in line then the list under it", () => {
    const blocks = parseBlocks("Keep this:\n- first\n- second");
    assert.equal(blocks[0]?.t, "p");
    assert.equal(blocks[1]?.t, "ul");
    if (blocks[1]?.t === "ul") assert.deepEqual(blocks[1].items, ["first", "second"]);
  });

  it("renders a heading and a numbered list", () => {
    const blocks = parseBlocks("## Warranty\n\n1. TruPro\n2. See the actual OC warranty.");
    assert.equal(blocks[0]?.t, "h");
    if (blocks[0]?.t === "h") {
      assert.equal(blocks[0].level, 2);
      assert.equal(blocks[0].text, "Warranty");
    }
    assert.equal(blocks[1]?.t, "ol");
  });

  it("keeps a fenced say-this block as pre, not a paragraph", () => {
    const blocks = parseBlocks("```\nI stopped by to see if you heard what’s been going on.\n```");
    assert.equal(blocks[0]?.t, "pre");
    if (blocks[0]?.t === "pre") assert.match(blocks[0].text, /stopped by/);
  });
});
