import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatTurn } from "@/lib/coach-ask";
import { coachKey, loadAllCoach, loadCoach, saveCoach } from "@/lib/memory";
import type { RufusHatId } from "@/lib/rufus-hats";

type CoachState = {
  messages: ChatTurn[];
  ticketId: string | null;
  hat: RufusHatId;
  answers: Record<string, string>;
  push: (turn: ChatTurn) => void;
  setAll: (messages: ChatTurn[]) => void;
  setTicketId: (id: string | null) => void;
  setHat: (hat: RufusHatId) => void;
  remember: (question: string, ticketId: string | null, text: string) => void;
  lookup: (question: string, ticketId: string | null) => string | undefined;
  lookupAsync: (question: string, ticketId: string | null) => Promise<string | undefined>;
  reset: () => void;
};

export const useCoach = create<CoachState>()(
  persist(
    (set, get) => ({
      messages: [],
      ticketId: null,
      hat: "door",
      answers: {},
      push: (turn) => set((s) => ({ messages: [...s.messages, turn].slice(-40) })),
      setAll: (messages) => set({ messages: messages.slice(-40) }),
      setTicketId: (ticketId) => set({ ticketId }),
      setHat: (hat) => set({ hat }),
      remember: (question, ticketId, text) => {
        const key = coachKey(question, ticketId);
        set((s) => ({ answers: { ...s.answers, [key]: text } }));
        void saveCoach({ key, question, answer: text, ticketId, at: Date.now() });
      },
      lookup: (question, ticketId) => get().answers[coachKey(question, ticketId)],
      lookupAsync: async (question, ticketId) => {
        const key = coachKey(question, ticketId);
        const warm = get().answers[key];
        if (warm) return warm;
        const row = await loadCoach(key);
        if (!row) return undefined;
        set((s) => ({ answers: { ...s.answers, [key]: row.answer } }));
        return row.answer;
      },
      reset: () => set({ messages: [] }),
    }),
    {
      name: "roofus-coach",
      partialize: (s) => ({ messages: s.messages, ticketId: s.ticketId, hat: s.hat }),
    },
  ),
);

if (typeof window !== "undefined") {
  void (async () => {
    const rows = await loadAllCoach();
    const answers: Record<string, string> = {};
    for (const row of rows) answers[row.key] = row.answer;
    useCoach.setState({ answers });
  })();
}
