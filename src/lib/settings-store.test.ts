import "./test-setup.ts";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_PACKETS, type CompanyPacket } from "./company-packets.ts";
import { useSettings } from "./settings-store.ts";

function packet(id: string): CompanyPacket {
  return {
    id,
    title: id,
    kind: "flyer",
    notes: "",
    extracted: "",
    thumb: "",
    mime: "image/jpeg",
    bytes: 0,
    addedAt: 1,
  };
}

describe("addCompanyPacket", () => {
  beforeEach(() => {
    useSettings.setState({ companyPackets: [], companyPacketError: "" });
  });

  it("caps at MAX_PACKETS", () => {
    useSettings.setState({
      companyPackets: Array.from({ length: MAX_PACKETS }, (_, i) => packet(`p_${i}`)),
    });
    const err = useSettings.getState().addCompanyPacket(packet("p_new"));
    assert.match(err, /cap/);
    assert.equal(useSettings.getState().companyPackets.length, MAX_PACKETS);
  });
});
