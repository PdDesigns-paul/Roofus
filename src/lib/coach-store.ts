import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RufusHatId } from "@/lib/rufus-hats";
import type { ChatTurn } from "@/lib/stream-coach";

export type ThreadOrigin = "porch" | "help" | "house" | "inspect";

export type CoachThread = {
  id: string;
  title: string;
  origin: ThreadOrigin;
  hat: RufusHatId;
  houseId: string | null;
  messages: ChatTurn[];
  createdAt: number;
  updatedAt: number;
};

const EMPTY: ChatTurn[] = [];
const MAX_THREADS = 20;
const MAX_TURNS = 40;

type CoachState = {
  hydrated: boolean;
  threads: Record<string, CoachThread>;
  order: string[];
  activeId: string | null;
  streaming: string;
  busy: boolean;
  historyOpen: boolean;
  sheetOpen: boolean;
  hat: RufusHatId;
  houseId: string | null;
  messages: ChatTurn[];
  setHistoryOpen: (open: boolean) => void;
  openSheet: () => void;
  closeSheet: () => void;
  setHat: (hat: RufusHatId) => void;
  resume: () => void;
  startNew: () => void;
  ensureInspect: () => void;
  openThread: (id: string) => void;
  dropThread: (id: string) => void;
  pushUser: (content: string) => void;
  setStreaming: (text: string) => void;
  setBusy: (busy: boolean) => void;
  finishAssistant: (content: string) => void;
  clearStreaming: () => void;
};

function newId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function titleFor(origin: ThreadOrigin, first?: string, address?: string) {
  if (origin === "help") return "How this page works";
  if (origin === "inspect") return "Inspect";
  if (origin === "house") {
    const street = address?.split(",")[0]?.trim();
    return street || "This house";
  }
  const line = first?.trim().split("\n")[0] ?? "";
  return line.slice(0, 48) || "Roofus";
}

function makeThread(
  origin: ThreadOrigin,
  extra?: { hat?: RufusHatId; houseId?: string | null; title?: string },
): CoachThread {
  const now = Date.now();
  return {
    id: newId(),
    title: extra?.title ?? titleFor(origin),
    origin,
    hat: extra?.hat ?? "door",
    houseId: extra?.houseId ?? null,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function capThreads(
  threads: Record<string, CoachThread>,
  order: string[],
  keep: string | null,
) {
  const nextOrder = order.slice(0, MAX_THREADS);
  if (keep && !nextOrder.includes(keep)) nextOrder.unshift(keep);
  const keepSet = new Set(nextOrder.slice(0, MAX_THREADS));
  const nextThreads: Record<string, CoachThread> = {};
  for (const id of keepSet) {
    if (threads[id]) nextThreads[id] = threads[id];
  }
  return { threads: nextThreads, order: [...keepSet] };
}

function patchActive(
  s: CoachState,
  write: (t: CoachThread) => CoachThread,
): Partial<CoachState> {
  const id = s.activeId;
  if (!id || !s.threads[id]) return {};
  const thread = write(s.threads[id]);
  return {
    threads: { ...s.threads, [id]: thread },
    order: [id, ...s.order.filter((x) => x !== id)],
    hat: thread.hat,
    houseId: thread.houseId,
    messages: thread.messages,
  };
}

function activate(s: CoachState, thread: CoachThread): Partial<CoachState> {
  const { threads, order } = capThreads(
    { ...s.threads, [thread.id]: thread },
    [thread.id, ...s.order.filter((id) => id !== thread.id)],
    thread.id,
  );
  return {
    threads,
    order,
    activeId: thread.id,
    hat: thread.hat,
    houseId: thread.houseId,
    messages: thread.messages,
  };
}

function migrateV1(): { threads: Record<string, CoachThread>; order: string[]; activeId: string } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("roofus-coach");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { messages?: ChatTurn[]; hat?: RufusHatId; ticketId?: string | null };
    };
    const st = parsed.state;
    localStorage.removeItem("roofus-coach");
    if (!st?.messages?.length) return null;
    const thread = makeThread("porch", {
      hat: st.hat ?? "door",
      houseId: st.ticketId ?? null,
    });
    thread.messages = st.messages.filter((m) => m.content).slice(-MAX_TURNS);
    thread.title = titleFor("porch", thread.messages.find((m) => m.role === "user")?.content);
    thread.updatedAt = Date.now();
    return { threads: { [thread.id]: thread }, order: [thread.id], activeId: thread.id };
  } catch {
    return null;
  }
}

const waiters: Array<() => void> = [];

export function whenCoachReady(fn: () => void) {
  if (useCoach.getState().hydrated) fn();
  else waiters.push(fn);
}

function flushReady() {
  useCoach.setState({ hydrated: true });
  while (waiters.length) waiters.shift()?.();
}

export const useCoach = create<CoachState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      threads: {},
      order: [],
      activeId: null,
      streaming: "",
      busy: false,
      historyOpen: false,
      sheetOpen: false,
      hat: "door",
      houseId: null,
      messages: EMPTY,
      setHistoryOpen: (historyOpen) => set({ historyOpen }),
      openSheet: () => set({ sheetOpen: true, historyOpen: false }),
      closeSheet: () => set({ sheetOpen: false }),
      setHat: (hat) =>
        set((s) => ({
          hat,
          ...patchActive(s, (t) => ({ ...t, hat, updatedAt: Date.now() })),
        })),
      resume: () =>
        set((s) => {
          if (s.activeId && s.threads[s.activeId]) {
            const t = s.threads[s.activeId];
            return { hat: t.hat, houseId: t.houseId, messages: t.messages, historyOpen: false };
          }
          const first = s.order[0] ? s.threads[s.order[0]] : null;
          if (first) {
            return {
              activeId: first.id,
              hat: first.hat,
              houseId: first.houseId,
              messages: first.messages,
              historyOpen: false,
            };
          }
          const thread = makeThread("porch");
          return { ...activate(s, thread), historyOpen: false };
        }),
      startNew: () =>
        set((s) => {
          const thread = makeThread("porch");
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
            historyOpen: false,
          };
        }),
      ensureInspect: () =>
        set((s) => {
          const active = s.activeId ? s.threads[s.activeId] : null;
          if (active?.origin === "inspect" && active.messages.length === 0) {
            return { hat: active.hat, houseId: active.houseId, messages: active.messages };
          }
          const thread = makeThread("inspect");
          return {
            ...activate(s, thread),
            streaming: "",
            busy: false,
          };
        }),
      openThread: (id) =>
        set((s) => {
          const t = s.threads[id];
          if (!t) return {};
          return {
            ...activate(s, t),
            streaming: "",
            busy: false,
            historyOpen: false,
          };
        }),
      dropThread: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.threads;
          const order = s.order.filter((x) => x !== id);
          const activeId = s.activeId === id ? (order[0] ?? null) : s.activeId;
          const t = activeId ? rest[activeId] : null;
          return {
            threads: rest,
            order,
            activeId,
            hat: t?.hat ?? "door",
            houseId: t?.houseId ?? null,
            messages: t?.messages ?? EMPTY,
          };
        }),
      pushUser: (content) =>
        set((s) =>
          patchActive(s, (t) => {
            const messages = [...t.messages, { role: "user" as const, content }].slice(-MAX_TURNS);
            const title =
              t.origin === "porch" && t.messages.length === 0 ? titleFor("porch", content) : t.title;
            return { ...t, messages, title, updatedAt: Date.now() };
          }),
        ),
      setStreaming: (streaming) => set({ streaming }),
      setBusy: (busy) => set({ busy }),
      finishAssistant: (content) =>
        set((s) => ({
          streaming: "",
          busy: false,
          ...patchActive(s, (t) => ({
            ...t,
            messages: [...t.messages, { role: "assistant" as const, content }].slice(-MAX_TURNS),
            updatedAt: Date.now(),
          })),
        })),
      clearStreaming: () => set({ streaming: "", busy: false }),
    }),
    {
      name: "roofus-threads-v1",
      skipHydration: true,
      partialize: (s) => ({
        threads: s.threads,
        order: s.order,
        activeId: s.activeId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CoachState>;
        const threads = p.threads ?? {};
        const order = (p.order ?? []).filter((id) => threads[id]);
        const activeId = p.activeId && threads[p.activeId] ? p.activeId : (order[0] ?? null);
        const t = activeId ? threads[activeId] : null;
        return {
          ...current,
          threads,
          order,
          activeId,
          hat: t?.hat ?? "door",
          houseId: t?.houseId ?? null,
          messages: t?.messages ?? EMPTY,
        };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void Promise.resolve(useCoach.persist.rehydrate()).then(() => {
    if (!Object.keys(useCoach.getState().threads).length) {
      const legacy = migrateV1();
      if (legacy) {
        const t = legacy.threads[legacy.activeId];
        useCoach.setState({
          ...legacy,
          hat: t?.hat ?? "door",
          houseId: t?.houseId ?? null,
          messages: t?.messages ?? EMPTY,
        });
      }
    }
    flushReady();
  });
  window.setTimeout(() => {
    if (!useCoach.getState().hydrated) flushReady();
  }, 600);
}
