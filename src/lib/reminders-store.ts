import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localDateKey } from "./day-book.ts";
import {
  blankReminderPrefs,
  type ReminderId,
  type ReminderPrefs,
} from "./reminders.ts";

type ReminderState = ReminderPrefs & {
  toggle: (id: ReminderId) => void;
  markDone: (id: ReminderId, day?: string) => void;
};

export const useReminders = create<ReminderState>()(
  persist(
    (set, get) => ({
      ...blankReminderPrefs(),
      toggle: (id) =>
        set({
          on: { ...get().on, [id]: !get().on[id] },
        }),
      markDone: (id, day = localDateKey()) =>
        set({
          lastDone: { ...get().lastDone, [id]: day },
        }),
    }),
    {
      name: "roofus-reminders-v1",
      partialize: (s) => ({ on: s.on, lastDone: s.lastDone }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useReminders.persist.rehydrate();
}
