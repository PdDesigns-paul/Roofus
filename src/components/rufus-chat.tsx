import { Link } from "@tanstack/react-router";
import { ArrowLeft, History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/chat-bubble";
import { HelpButton } from "@/components/help-button";
import { Tip } from "@/components/ui/tooltip";
import { abortTalk, sendRoofus, stopRoofus } from "@/lib/roofus-talk";
import { useCoach } from "@/lib/coach-store";
import { hatById, RUFUS_HATS, type RufusHatId } from "@/lib/rufus-hats";

export function RufusChat() {
  const messages = useCoach((s) => s.messages);
  const hatId = useCoach((s) => s.hat);
  const setHat = useCoach((s) => s.setHat);
  const pendingPrompt = useCoach((s) => s.pendingPrompt);
  const pendingAt = useCoach((s) => s.pendingAt);
  const streaming = useCoach((s) => s.streaming);
  const busy = useCoach((s) => s.busy);
  const startNew = useCoach((s) => s.startNew);
  const setHistoryOpen = useCoach((s) => s.setHistoryOpen);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const sentAt = useRef(0);
  const hat = hatById(hatId);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streaming, busy]);

  useEffect(() => {
    if (!pendingAt || sentAt.current === pendingAt) return;
    const q = pendingPrompt ?? useCoach.getState().pendingPrompt;
    if (!q) return;
    sentAt.current = pendingAt;
    useCoach.getState().clearPending();
    void onSend(q);
    // one-shot help / house walk-up
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAt]);

  function pickHat(id: RufusHatId) {
    setHat(id);
    setError(null);
  }

  async function onSend(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);
    try {
      await sendRoofus(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Roofus missed that.");
    }
  }

  const shown = streaming
    ? [...messages, { role: "assistant" as const, content: streaming }]
    : messages;

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-paper">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-paper/95 px-4 pt-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Home"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted">
            <img src="/roofus.png" alt="" className="size-7 object-contain" />
            <span className="font-medium text-fg">Roofus</span>
            <span className="text-faint">· {hat.label}</span>
          </div>
          <div className="flex items-center">
            <HelpButton page="coach" />
            <Tip label="Past chats">
              <button
                type="button"
                aria-label="Past chats"
                className="inline-flex size-10 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                onClick={() => setHistoryOpen(true)}
              >
                <History className="size-5" />
              </button>
            </Tip>
            <Tip label="Start a new chat">
              <button
                type="button"
                onClick={() => {
                  abortTalk();
                  startNew();
                  setError(null);
                }}
                className="h-10 px-2 text-xs text-faint hover:text-fg"
              >
                New
              </button>
            </Tip>
          </div>
        </div>
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto pb-3">
          {RUFUS_HATS.map((h) => (
            <Tip key={h.id} label={h.hint} side="bottom">
              <button
                type="button"
                onClick={() => pickHat(h.id)}
                className={
                  h.id === hat.id
                    ? "shrink-0 rounded-full bg-fg px-3 py-1.5 text-xs text-paper"
                    : "shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted"
                }
              >
                {h.label}
              </button>
            </Tip>
          ))}
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {shown.length === 0 ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">{hat.hint}</p>
            <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">{hat.label}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">{hat.use}</p>
            <div className="mt-5 flex flex-col gap-2">
              {hat.starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="min-h-11 rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed text-fg hover:bg-surface-2"
                  onClick={() => void onSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          shown.map((m, i) => (
            <ChatBubble
              key={`${m.role}-${i}`}
              role={m.role}
              streaming={busy && i === shown.length - 1 && m.role === "assistant"}
            >
              {m.content}
            </ChatBubble>
          ))
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div ref={bottom} />
      </div>

      <form
        className="sticky bottom-0 z-10 border-t border-border/70 bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
      >
        <div className="flex gap-2">
          <input
            className="h-12 flex-1 rounded-full border border-border bg-surface px-4 text-base"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={hat.id === "roleplay" ? "Say it like you’re on the porch…" : "Ask Roofus…"}
            enterKeyHint="send"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stopRoofus()}
              className="h-12 rounded-full border border-border px-5 text-sm"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="h-12 rounded-full bg-fg px-5 text-sm text-paper disabled:opacity-40"
            >
              Send
            </button>
          )}
        </div>
        <nav className="mt-2 flex items-center justify-around text-[11px] text-faint">
          <Link to="/" className="hover:text-fg">
            Home
          </Link>
          <span className="text-fg">Roofus</span>
          <Link to="/coach/inspect" className="hover:text-fg">
            Inspect
          </Link>
          <Link to="/coach/mindset" className="hover:text-fg">
            Mindset
          </Link>
        </nav>
      </form>
    </main>
  );
}
