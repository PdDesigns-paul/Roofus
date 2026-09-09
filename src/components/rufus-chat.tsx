import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/chat-bubble";
import { HelpButton } from "@/components/help-button";
import { Tip } from "@/components/ui/tooltip";
import { useCoach } from "@/lib/coach-store";
import { formatHouseBlurb } from "@/lib/house-lookup";
import { useHouses } from "@/lib/houses-store";
import { hatById, RUFUS_HATS, type RufusHatId } from "@/lib/rufus-hats";
import { streamCoach } from "@/lib/stream-coach";

export function RufusChat() {
  const messages = useCoach((s) => s.messages);
  const push = useCoach((s) => s.push);
  const patchLast = useCoach((s) => s.patchLast);
  const reset = useCoach((s) => s.reset);
  const hatId = useCoach((s) => s.hat);
  const setHat = useCoach((s) => s.setHat);
  const ticketId = useCoach((s) => s.ticketId);
  const setTicketId = useCoach((s) => s.setTicketId);
  const pendingPrompt = useCoach((s) => s.pendingPrompt);
  const helpAt = useCoach((s) => s.helpAt);
  const houses = useHouses((s) => s.houses);
  const order = useHouses((s) => s.order);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const helpSent = useRef(0);
  const flushAt = useRef(0);
  const hat = hatById(hatId);
  const house = ticketId ? houses[ticketId] : order[0] ? houses[order[0]] : undefined;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, messages[messages.length - 1]?.content, busy]);

  useEffect(() => {
    if (!helpAt || helpSent.current === helpAt) return;
    const q = pendingPrompt ?? useCoach.getState().pendingPrompt;
    if (!q) return;
    helpSent.current = helpAt;
    useCoach.getState().clearPending();
    void send(q);
    // one-shot from Help / This House / FAB
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpAt]);

  function houseBlurb() {
    if (!house) return undefined;
    return formatHouseBlurb(house);
  }

  function pickHat(id: RufusHatId) {
    setHat(id);
    setError(null);
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content) return;
    stop();
    setDraft("");
    setError(null);
    push({ role: "user", content });
    push({ role: "assistant", content: "" });
    setBusy(true);
    stop();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const clean = useCoach
        .getState()
        .messages.filter((m) => m.role === "user" || m.content)
        .slice(-16);
      const textOut = await streamCoach(
        {
          messages: clean,
          ticketBlurb: houseBlurb(),
          hat: useCoach.getState().hat,
        },
        (next) => {
          const now = Date.now();
          if (now - flushAt.current > 40) {
            flushAt.current = now;
            patchLast(next);
          }
        },
        ac.signal,
      );
      patchLast(textOut || "…");
      useCoach.getState().remember(content, ticketId, textOut || "…");
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Roofus missed that.");
      const last = useCoach.getState().messages.at(-1);
      if (last?.role === "assistant" && !last.content) {
        useCoach.setState({ messages: useCoach.getState().messages.slice(0, -1) });
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

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
            <Tip label="Start a new chat">
              <button
                type="button"
                onClick={() => {
                  stop();
                  reset();
                  setError(null);
                  setBusy(false);
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
        {messages.length === 0 ? (
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
                  onClick={() => void send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatBubble
              key={`${m.role}-${i}`}
              role={m.role}
              streaming={busy && i === messages.length - 1 && m.role === "assistant"}
            >
              {m.content}
            </ChatBubble>
          ))
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {house ? (
          <button
            type="button"
            className="truncate text-left text-xs text-faint"
            onClick={() => setTicketId(house.id === ticketId ? null : house.id)}
          >
            {ticketId === house.id ? "Using this house" : "Use this house"} ·{" "}
            {house.address.split(",")[0]}
            {house.yearBuilt ? ` · ${house.yearBuilt}` : ""}
          </button>
        ) : null}
        <div ref={bottom} />
      </div>

      <form
        className="sticky bottom-0 z-10 border-t border-border/70 bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
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
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="h-12 rounded-full bg-fg px-5 text-sm text-paper disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <nav className="mt-2 flex items-center justify-around text-[11px] text-faint">
          <Link to="/" className="hover:text-fg">
            Home
          </Link>
          <span className="text-fg">Roofus</span>
          <Link to="/house" className="hover:text-fg">
            House
          </Link>
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
