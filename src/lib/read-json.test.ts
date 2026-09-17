import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isParseDump, parseJson, phoneError } from "./read-json.ts";

describe("parseJson", () => {
  it("reads an object", () => {
    assert.deepEqual(parseJson('{"quiet":true}'), { quiet: true });
  });
  it("rejects the IEM/proxy junk that hit the phone", () => {
    assert.equal(parseJson(`Port hds-6 is not a feed`), null);
    assert.equal(parseJson("<html>nope</html>"), null);
    assert.equal(parseJson(""), null);
    assert.equal(parseJson("{broken"), null);
  });
});

describe("phoneError", () => {
  it("does not dump JSON.parse onto Today", () => {
    const dumped = `Unexpected token 'P', "Port hds-6"... is not valid JSON`;
    assert.equal(isParseDump(dumped), true);
    assert.equal(phoneError(dumped, "Could not check the last 48 hours."), "Could not check the last 48 hours.");
    assert.equal(
      phoneError(new Error(dumped), "Could not check the last 48 hours."),
      "Could not check the last 48 hours.",
    );
  });
  it("keeps a short product miss", () => {
    assert.equal(phoneError("Need a county and a state in Settings first.", "Nope."), "Need a county and a state in Settings first.");
  });
});
