import { Sheet } from "@/components/sheet";
import { openCoach, openCoachThread } from "@/lib/open-coach";
import { useCoach, type CoachThread, type ThreadOrigin } from "@/lib/coach-store";

function ago(at: number) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function originLabel(origin: ThreadOrigin) {
  if (origin === "help") return "Help";
  if (origin === "inspect") return "Inspect";
  if (origin === "mindset") return "Mindset";
  return "Porch";
}

export function ChatHistory() {
  const open = useCoach((s) => s.historyOpen);
  const setOpen = useCoach((s) => s.setHistoryOpen);
  const threads = useCoach((s) => s.threads);
  const order = useCoach((s) => s.order);
  const activeId = useCoach((s) => s.activeId);
  const dropThread = useCoach((s) => s.dropThread);

  const rows = order
    .map((id) => threads[id])
    .filter((t): t is CoachThread => Boolean(t && t.messages.length));

  return (
    <Sheet open={open} onClose={() => setOpen(false)} z={60}>
      <div className="mt-3 flex items-center justify-between">
        <h2 className="font-display text-2xl">Chats</h2>
        <button
          type="button"
          className="h-10 rounded-full bg-fg px-4 text-sm text-paper"
          onClick={() => {
            setOpen(false);
            openCoach("new");
          }}
        >
          New chat
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing saved yet. Tap New chat.</p>
      ) : (
        <ul className="mt-4 max-h-[55dvh] overflow-y-auto">
          {rows.map((t) => (
            <li key={t.id} className="flex items-stretch gap-2 border-b border-border last:border-0">
              <button
                type="button"
                className="min-h-14 flex-1 py-3 text-left"
                onClick={() => {
                  setOpen(false);
                  openCoachThread(t.id);
                }}
              >
                <span className="block truncate text-sm text-fg">{t.title}</span>
                <span className="mt-0.5 block text-xs text-faint">
            {originLabel(t.origin)} · {ago(t.updatedAt)}
                  {t.id === activeId ? " · open" : ""}
                </span>
              </button>
              <button
                type="button"
                className="shrink-0 px-2 text-xs text-faint hover:text-fg"
                onClick={() => dropThread(t.id)}
              >
                Drop
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
