import "./test-setup.ts";
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { useCoach } from "./coach-store.ts";

function reset() {
  useCoach.setState({
    threads: {},
    order: [],
    activeId: null,
    messages: [],
    hat: "door",
    walkId: null,
    houseId: null,
    streaming: "",
    busy: false,
    historyOpen: false,
    sheetOpen: false,
  });
}

describe("ensureInspect", () => {
  beforeEach(reset);

  it("starts a blank inspect thread instead of reopening the last one", () => {
    const old = {
      id: "t_old",
      title: "Inspect",
      origin: "inspect" as const,
      hat: "door" as const,
      walkId: null,
      houseId: null,
      messages: [
        { role: "user" as const, content: "old hail question" },
        { role: "assistant" as const, content: "old answer" },
      ],
      createdAt: 1,
      updatedAt: 1,
    };
    useCoach.setState({
      threads: { t_old: old },
      order: ["t_old"],
      activeId: "t_old",
      messages: old.messages,
    });

    useCoach.getState().ensureInspect();
    const s = useCoach.getState();
    assert.notEqual(s.activeId, "t_old");
    assert.equal(s.threads[s.activeId ?? ""]?.origin, "inspect");
    assert.deepEqual(s.messages, []);
    assert.equal(s.threads.t_old?.messages.length, 2);
  });

  it("keeps the current inspect thread when it is still empty", () => {
    useCoach.getState().ensureInspect();
    const first = useCoach.getState().activeId;
    useCoach.getState().ensureInspect();
    assert.equal(useCoach.getState().activeId, first);
  });
});

describe("switchHat", () => {
  beforeEach(reset);

  it("retags an empty thread", () => {
    useCoach.getState().startNew({ hat: "door" });
    const first = useCoach.getState().activeId;
    useCoach.getState().switchHat("roleplay");
    const s = useCoach.getState();
    assert.equal(s.activeId, first);
    assert.equal(s.hat, "roleplay");
    assert.deepEqual(s.messages, []);
  });

  it("starts a new chat when the current one already has lines", () => {
    useCoach.getState().startNew({ hat: "door" });
    const doorId = useCoach.getState().activeId;
    useCoach.getState().pushUser("Give me the million-dollar door script.");
    useCoach.getState().switchHat("roleplay");
    const s = useCoach.getState();
    assert.notEqual(s.activeId, doorId);
    assert.equal(s.hat, "roleplay");
    assert.deepEqual(s.messages, []);
    assert.equal(s.threads[doorId ?? ""]?.messages.length, 1);
    assert.equal(s.threads[doorId ?? ""]?.hat, "door");
  });
});
