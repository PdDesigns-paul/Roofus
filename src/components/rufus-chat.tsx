/** Ride-along chat. Hats stay pinned. The dog in the corner is Roofus. */
import { X, History } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/chat-bubble";
import { HearIt } from "@/components/hear-it";
import { HelpButton } from "@/components/help-button";
import { RoleplayMic } from "@/components/roleplay-mic";
import { RoofusFace, RoofusMark } from "@/components/roofus-mark";
import { Tip } from "@/components/ui/tooltip";
import { abortTalk, sendRoofus, stopRoofus } from "@/lib/roofus-talk";
import { useCoach } from "@/lib/coach-store";
import {
  hatById,
  ROLEPLAY_WHO,
  roleplayKnockLine,
  RUFUS_HATS,
  type RoleplayWhoId,
  type RufusHatId,
} from "@/lib/rufus-hats";
import { WALKS, walkKickoff, type WalkId } from "@/lib/survive";

export function RufusChat({ embedded = false }: { embedded?: boolean }) {
  const messages = useCoach((s) => s.messages);
  const hatId = useCoach((s) => s.hat);
  const setHat = useCoach((s) => s.setHat);
  const setWalk = useCoach((s) => s.setWalk);
  const streaming = useCoach((s) => s.streaming);
  const busy = useCoach((s) => s.busy);
  const startNew = useCoach((s) => s.startNew);
  const setHistoryOpen = useCoach((s) => s.setHistoryOpen);
  const closeSheet = useCoach((s) => s.closeSheet);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const hat = hatById(hatId);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streaming, busy]);

  function pickHat(id: RufusHatId) {
    abortTalk();
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

  async function startWalk(id: WalkId) {
    const walk = WALKS.find((w) => w.id === id);
    setError(null);
    setWalk(id, walk?.title);
    try {
      await sendRoofus(walkKickoff(id), { kickoff: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Roofus missed that.");
    }
  }

  const shown = busy
    ? [...messages, { role: "assistant" as const, content: streaming }]
    : messages;

  const placeholder =
    hat.id === "roleplay"
      ? "Hold the mic and knock, or type it."
      : hat.id === "mindset"
        ? "Your answer"
        : "What just happened?";

  return (
    <div
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col"
          : "relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col bg-paper"
      }
    >
      <header className="shrink-0 border-b border-border/70 px-4 pt-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label={embedded ? "Close" : "Close"}
            onClick={() => closeSheet()}
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted">
            <RoofusFace className="size-10" alt="" />
            <span className="font-medium text-fg">Roofus</span>
            <span className="text-faint">· {hat.label}</span>
          </div>
          <div className="flex items-center">
            <HelpButton page="coach" />
            <Tip label="Past chats">
              <button
                type="button"
                aria-label="Past chats"
                className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
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
                className="h-11 px-2 text-xs text-faint hover:text-fg"
              >
                New
              </button>
            </Tip>
          </div>
        </div>
        <div className="-mx-1 mt-1 flex gap-1.5 overflow-x-auto pb-3">
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

      <div className="relative min-h-0 flex-1">
        <RoofusMark />
        <div className="relative z-10 flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4">
        {shown.length === 0 ? (
          hat.id === "roleplay" ? (
            <RoleplayScene onKnock={(line) => void onSend(line)} />
          ) : hat.id === "mindset" ? (
            <MindsetStart onWalk={(id) => void startWalk(id)} />
          ) : (
            <div className="mt-2">
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
          )
        ) : (
          shown.map((m, i) => (
            <div key={`${m.role}-${i}`}>
              <ChatBubble
                role={m.role}
                streaming={busy && i === shown.length - 1 && m.role === "assistant"}
              >
                {m.content}
              </ChatBubble>
              {hat.id === "roleplay" &&
              m.role === "assistant" &&
              m.content.trim() &&
              !(busy && i === shown.length - 1) ? (
                <HearIt text={m.content} />
              ) : null}
            </div>
          ))
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div ref={bottom} />
        </div>
      </div>

      <form
        className="shrink-0 border-t border-border/70 bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
      >
        {hat.id === "roleplay" && shown.length > 0 && !busy ? (
          <button
            type="button"
            onClick={() => void onSend("score me")}
            className="mb-2 h-11 w-full rounded-full border border-border text-sm"
          >
            Score me
          </button>
        ) : null}
        <div className="flex items-center gap-2">
          {hat.id === "roleplay" ? (
            <RoleplayMic
              disabled={busy}
              onText={(text) => void onSend(text)}
              onError={(msg) => setError(msg)}
            />
          ) : null}
          <input
            className="h-12 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-base"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
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
      </form>
    </div>
  );
}

function RoleplayScene({ onKnock }: { onKnock: (line: string) => void }) {
  const [who, setWho] = useState<RoleplayWhoId>("busy");
  const [year, setYear] = useState("");

  return (
    <div className="mt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">You be them</p>
      <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">Roleplay</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Pick who they are. Then knock. Hold the mic or type it. Score me after.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {ROLEPLAY_WHO.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWho(w.id)}
            className={`min-h-11 rounded-2xl px-4 py-3 text-left text-sm ${
              who === w.id ? "bg-fg text-paper" : "border border-border bg-surface"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="text-xs text-muted">Roof year</span>
        <input
          className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-base"
          inputMode="numeric"
          placeholder="2004"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => onKnock(roleplayKnockLine(who, year))}
        className="mt-4 h-12 w-full rounded-full bg-fg text-sm text-paper"
      >
        Knock
      </button>
    </div>
  );
}

function MindsetStart({ onWalk }: { onWalk: (id: WalkId) => void }) {
  return (
    <div className="mt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Truck only</p>
      <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">Mindset</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        One question at a time. Private. Never a porch line.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        {WALKS.map((w) => (
          <button
            key={w.id}
            type="button"
            className="min-h-11 rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed text-fg hover:bg-surface-2"
            onClick={() => onWalk(w.id)}
          >
            {w.title}
          </button>
        ))}
      </div>
    </div>
  );
}
