import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isNotionTable,
  looksLikeNotionToken,
  parseNotionId,
  validNotionIds,
} from "./notion-ids.ts";

describe("parseNotionId", () => {
  it("reads a dashed UUID", () => {
    assert.equal(
      parseNotionId("277d1c0e-0e3a-80aa-9dc0-f3f2f1e8e2c5"),
      "277d1c0e-0e3a-80aa-9dc0-f3f2f1e8e2c5",
    );
  });

  it("reads a share link with title and query", () => {
    const id = parseNotionId(
      "https://www.notion.so/Roofus-backup-277d1c0e0e3a80aa9dc0f3f2f1e8e2c5?pvs=4",
    );
    assert.equal(id, "277d1c0e-0e3a-80aa-9dc0-f3f2f1e8e2c5");
  });

  it("rejects junk", () => {
    assert.equal(parseNotionId("https://www.notion.so/"), null);
    assert.equal(parseNotionId(""), null);
  });
});

describe("looksLikeNotionToken", () => {
  it("accepts ntn_ and secret_", () => {
    assert.equal(looksLikeNotionToken("ntn_abc"), true);
    assert.equal(looksLikeNotionToken(" secret_abc "), true);
    assert.equal(looksLikeNotionToken("sk-live"), false);
  });
});

describe("validNotionIds", () => {
  it("requires every table id", () => {
    const id = "277d1c0e-0e3a-80aa-9dc0-f3f2f1e8e2c5";
    assert.equal(
      validNotionIds({
        parentPageId: id,
        daysDb: id,
        streetsDb: id,
        stormsDb: id,
        mindsetDb: id,
        memoryDb: id,
        pinsDb: id,
      }),
      true,
    );
    assert.equal(validNotionIds({ parentPageId: id }), false);
    assert.equal(isNotionTable("days"), true);
    assert.equal(isNotionTable("pins"), true);
    assert.equal(isNotionTable("nope"), false);
  });
});
