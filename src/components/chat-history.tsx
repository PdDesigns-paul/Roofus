import { useNavigate } from "@tanstack/react-router";
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
  return "Porch";
}

export function ChatHistory() {
  const open = useCoach((s) => s.historyOpen);
  const setOpen = useCoach((s) => s.setHistoryOpen);
  const threads = useCoach((s) => s.threads);
  const order = useCoach((s) => s.order);
  const activeId = useCoach((s) => s.activeId);
  const openThread = useCoach((s) => s.openThread);
  const dropThread = useCoach((s) => s.dropThread);
  const startNew = useCoach((s) => s.startNew);
  const navigate = useNavigate();

  if (!open) return null;

  const rows = order
    .map((id) => threads[id])
    .filter((t): t is CoachThread => Boolean(t && t.messages.length));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-fg/40" onClick={() => setOpen(false)}>
      <div
        className="max-h-[80dvh] w-full max-w-lg rounded-t-3xl border border-border bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Chats</h2>
          <button
            type="button"
            className="h-10 rounded-full bg-fg px-4 text-sm text-paper"
            onClick={() => {
              startNew();
              void navigate({ to: "/coach" });
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
                    openThread(t.id);
                    void navigate({ to: "/coach" });
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
      </div>
    </div>
  );
}
