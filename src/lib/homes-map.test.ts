import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PAGE_HELP } from "./page-help.ts";
import { DEFAULT_FAQS } from "./porch-faqs.ts";

describe("AAR homes after #39", () => {
  it("names Plan as the form home and does not say the form lives on Today", () => {
    const help = [
      PAGE_HELP.today.body.join(" "),
      PAGE_HELP.streets.body.join(" "),
      PAGE_HELP.mindset.body.join(" "),
      PAGE_HELP.settings.body.join(" "),
    ].join("\n");
    const win = DEFAULT_FAQS.find((f) => f.id === "f_seed_win")?.a ?? "";
    assert.match(PAGE_HELP.today.body.join(" "), /Night opens Finish the day on Plan/);
    assert.match(PAGE_HELP.streets.body.join(" "), /live here only/);
    assert.match(help, /After Action Report lives on Plan/);
    assert.doesNotMatch(help, /on Truck and After/);
    assert.doesNotMatch(help, /AAR lives on Truck/);
    assert.match(win, /live on Plan/);
    assert.doesNotMatch(win, /Ask Roofus tonight and he names tomorrow/);
  });
});
