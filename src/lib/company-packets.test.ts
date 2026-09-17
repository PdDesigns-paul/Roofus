import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addPacket,
  extractPdfText,
  MAX_PACKETS,
  packetsKnowledge,
  titleFromFileName,
  type CompanyPacket,
} from "./company-packets.ts";

function packet(partial: Partial<CompanyPacket>): CompanyPacket {
  return {
    id: partial.id ?? "p_test",
    title: partial.title ?? "",
    kind: partial.kind ?? "flyer",
    notes: partial.notes ?? "",
    extracted: partial.extracted ?? "",
    thumb: partial.thumb ?? "",
    mime: partial.mime ?? "image/jpeg",
    bytes: partial.bytes ?? 0,
    addedAt: partial.addedAt ?? 1,
  };
}

describe("packetsKnowledge", () => {
  it("posts notes in the book", () => {
    const book = packetsKnowledge([
      packet({
        title: "Duration flyer",
        kind: "warranty",
        notes: "Duration — see the actual OC warranty",
      }),
    ]);
    assert.match(book, /Duration flyer/);
    assert.match(book, /Duration — see the actual OC warranty/);
    assert.match(book, /Quote saved text only/);
  });

  it("title-only packet does not quote body text", () => {
    const book = packetsKnowledge([
      packet({
        title: "Claims how-to",
        kind: "form",
        notes: "   ",
        extracted: "50-year workmanship guaranteed. Lifetime labor.",
      }),
    ]);
    assert.match(book, /Claims how-to/);
    assert.match(book, /Title only/);
    assert.doesNotMatch(book, /50-year workmanship/);
    assert.doesNotMatch(book, /Lifetime labor/);
    assert.doesNotMatch(book, /guaranteed/);
  });

  it("includes extracted text only when notes exist", () => {
    const book = packetsKnowledge([
      packet({
        title: "OC sheet",
        kind: "warranty",
        notes: "See the actual OC warranty",
        extracted: "TruPro 50 including tear-off",
      }),
    ]);
    assert.match(book, /See the actual OC warranty/);
    assert.match(book, /TruPro 50 including tear-off/);
  });

  it("empty list is blank so website-only users stay quiet", () => {
    assert.equal(packetsKnowledge([]), "");
    assert.equal(packetsKnowledge(undefined), "");
  });
});

describe("addPacket", () => {
  it("caps count", () => {
    const full = Array.from({ length: MAX_PACKETS }, (_, i) => packet({ id: `p_${i}`, title: `P${i}` }));
    const { packets, error } = addPacket(full, packet({ id: "p_new", title: "Extra" }));
    assert.equal(packets.length, MAX_PACKETS);
    assert.match(error, /cap/);
  });

  it("caps bytes", () => {
    const heavy = packet({ id: "p_big", title: "Scan", thumb: "x".repeat(1_400_000) });
    const { packets, error } = addPacket([heavy], packet({ id: "p_two", title: "Two", thumb: "y".repeat(200_000) }));
    assert.equal(packets.length, 1);
    assert.match(error, /too heavy/);
  });
});

describe("titleFromFileName", () => {
  it("humanizes a real name and ignores camera junk", () => {
    assert.equal(titleFromFileName("claims-how-to.pdf"), "claims how to");
    assert.equal(titleFromFileName("IMG_1234.jpg"), "");
  });
});

describe("extractPdfText", () => {
  it("reads uncompressed Tj text and ignores non-PDFs", () => {
    const pdf = new TextEncoder().encode("%PDF-1.1\nBT\n(Duration - see the actual OC warranty) Tj\nET\n");
    assert.match(extractPdfText(pdf), /Duration - see the actual OC warranty/);
    assert.equal(extractPdfText(new TextEncoder().encode("not a pdf")), "");
  });
});

describe("packets land in the posted book", () => {
  it("coach prompt and talk send packet text", () => {
    const prompt = readFileSync(new URL("./coach-prompt.ts", import.meta.url), "utf8");
    const talk = readFileSync(new URL("./roofus-talk.ts", import.meta.url), "utf8");
    assert.match(prompt, /packetsKnowledge\(req\.companyPackets\)/);
    assert.match(prompt, /No text, no “I read your flyer.”/);
    assert.match(talk, /companyPackets:/);
    assert.match(talk, /extracted: p\.extracted/);
  });
});
