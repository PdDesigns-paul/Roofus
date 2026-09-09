import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askCoach, type ChatTurn } from "@/lib/coach-ask";
import { useCoach } from "@/lib/coach-store";
import { formatHouseBlurb } from "@/lib/house-lookup";
import { useHouses } from "@/lib/houses-store";
import { hatById, RUFUS_HATS, type RufusHatId } from "@/lib/rufus-hats";

export function RufusChat() {
  const messages = useCoach((s) => s.messages);
  const push = useCoach((s) => s.push);
  const reset = useCoach((s) => s.reset);
  const hatId = useCoach((s) => s.hat);
  const setHat = useCoach((s) => s.setHat);
  const ticketId = useCoach((s) => s.ticketId);
  const setTicketId = useCoach((s) => s.setTicketId);
  const houses = useHouses((s) => s.houses);
  const order = useHouses((s) => s.order);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const hat = hatById(hatId);
  const house = ticketId ? houses[ticketId] : order[0] ? houses[order[0]] : undefined;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, busy]);

  function houseBlurb() {
    if (!house) return undefined;
    return formatHouseBlurb(house);
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
          ticketBlurb: houseBlurb(),
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
