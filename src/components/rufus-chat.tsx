import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GableMark } from "@/components/gable-mark";
import { askCoach, type ChatTurn } from "@/lib/coach-ask";
import { useCoach } from "@/lib/coach-store";
import { hatById, RUFUS_HATS, type RufusHatId } from "@/lib/rufus-hats";
import { useJobs } from "@/lib/jobs-store";
import { formatRange } from "@/lib/utils";

export function RufusChat() {
  const messages = useCoach((s) => s.messages);
  const push = useCoach((s) => s.push);
  const reset = useCoach((s) => s.reset);
  const hatId = useCoach((s) => s.hat);
  const setHat = useCoach((s) => s.setHat);
  const ticketId = useCoach((s) => s.ticketId);
  const setTicketId = useCoach((s) => s.setTicketId);
  const jobs = useJobs((s) => s.jobs);
  const order = useJobs((s) => s.order);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const hat = hatById(hatId);
  const ticket = ticketId ? jobs[ticketId] : order[0] ? jobs[order[0]] : undefined;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  function ticketBlurb() {
    if (!ticket?.quote) return undefined;
    return [
      ticket.address,
      `range ${formatRange(ticket.quote.rangeLow, ticket.quote.rangeHigh)}`,
      `order ${ticket.quote.orderSquares.toFixed(2)} sq`,
      `pitch ${ticket.pitchOverride ?? ticket.analysis?.pitchPreset}`,
    ].join(" · ");
  }

  function pickHat(id: RufusHatId) {
    setHat(id);
    setError(null);
  }

  async function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);
    push({ role: "user", content });
    setBusy(true);
    try {
      const history: ChatTurn[] = [
        ...useCoach.getState().messages,
        { role: "user" as const, content },
      ].slice(-16);
      const res = await askCoach({
        data: {
          messages: history,
          ticketBlurb: ticketBlurb(),
          hat: useCoach.getState().hat,
        },
      });
      if (!res || !res.ok) {
        setError(!res ? "Roofus missed that. Try again." : res.error);
        return;
      }
      push({ role: "assistant", content: res.text });
      useCoach.getState().remember(content, ticketId, res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Roofus missed that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-paper">
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
            <GableMark className="size-4" />
            <span className="font-medium text-fg">Roofus</span>
            <span className="text-faint">· {hat.label}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              setError(null);
            }}
            className="h-10 px-2 text-xs text-faint hover:text-fg"
          >
            New
          </button>
        </div>
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto pb-3">
          {RUFUS_HATS.map((h) => (
            <button
              key={h.id}
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
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
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
            <div
              key={`${m.role}-${i}`}
              className={
                m.role === "user"
                  ? "ml-10 whitespace-pre-wrap rounded-2xl bg-fg px-4 py-3 text-sm leading-relaxed text-paper"
                  : "mr-6 whitespace-pre-wrap rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-fg"
              }
            >
              {m.content}
            </div>
          ))
        )}
        {busy ? (
          <p className="text-xs text-faint">
            {hat.id === "roleplay" ? "They are thinking…" : "Roofus is thinking…"}
          </p>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {ticket?.quote ? (
          <button
            type="button"
            className="truncate text-left text-xs text-faint"
            onClick={() => setTicketId(ticket.id === ticketId ? null : ticket.id)}
          >
            {ticketId === ticket.id ? "Using tape" : "Use tape"} · {ticket.address.split(",")[0]}
          </button>
        ) : null}
        <div ref={bottom} />
      </div>

      <form
        className="sticky bottom-0 border-t border-border/70 bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
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
          <Link to="/coach/inspect" className="hover:text-fg">
            Inspect
          </Link>
          <Link to="/coach/reference" className="hover:text-fg">
            Reference
          </Link>
          <Link to="/coach/mindset" className="hover:text-fg">
            Mindset
          </Link>
        </nav>
      </form>
    </main>
  );
}
