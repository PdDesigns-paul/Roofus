import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseGeocodeComponents } from "./pin-geocode.ts";

describe("parseGeocodeComponents", () => {
  it("fills address, house, city, state, zip from Google parts", () => {
    const out = parseGeocodeComponents(
      [
        { long_name: "12", short_name: "12", types: ["street_number"] },
        { long_name: "Oak Street", short_name: "Oak St", types: ["route"] },
        { long_name: "Mechanicsburg", short_name: "Mechanicsburg", types: ["locality"] },
        { long_name: "Pennsylvania", short_name: "PA", types: ["administrative_area_level_1"] },
        { long_name: "17050", short_name: "17050", types: ["postal_code"] },
      ],
      "12 Oak Street, Mechanicsburg, PA 17050, USA",
    );
    assert.equal(out.address, "12 Oak Street");
    assert.equal(out.houseNumber, "12");
    assert.equal(out.city, "Mechanicsburg");
    assert.equal(out.state, "PA");
    assert.equal(out.zip, "17050");
  });
});
