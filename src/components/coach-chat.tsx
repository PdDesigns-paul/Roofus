/** Ride-along chat. Mode comes from the orange fan. Roleplay beats sit in the thumb zone. */
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
import { RoleplayBar } from "@/components/roleplay-bar";
import {
  modeById,
  personForScene,
  PRACTICE_PLAN_COPY,
  practiceUnlocked,
  roleplayKnockLine,
} from "@/lib/coach-modes";
import { useSettings } from "@/lib/settings-store";
import { WALKS, walkKickoff, type WalkId } from "@/lib/survive";
import { currentPack } from "@/lib/tenant";


export function CoachChat({ embedded = false }: { embedded?: boolean }) {
  const pack = currentPack();
  const messages = useCoach((s) => s.messages);
  const modeId = useCoach((s) => s.mode);
  const scene = useCoach((s) => s.scene);
  const who = useCoach((s) => s.who);
  const setScene = useCoach((s) => s.setScene);
  const setWho = useCoach((s) => s.setWho);
  const setWalk = useCoach((s) => s.setWalk);
  const streaming = useCoach((s) => s.streaming);
  const busy = useCoach((s) => s.busy);
  const setHistoryOpen = useCoach((s) => s.setHistoryOpen);
  const closeSheet = useCoach((s) => s.closeSheet);
  const [draft, setDraft] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const mode = modeById(modeId);
  const beat = scene ?? "walkup";
  const person = personForScene(beat, who);
  const practiceOn = practiceUnlocked(useSettings((s) => s.practiceOn));

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streaming, busy]);

  async function onSend(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || busy) return;
    setDraft("");
    setError(null);
    try {
      await sendRoofus(content, { year });
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
  const roleplay = mode.id === "roleplay";
  const empty = shown.length === 0;

  const placeholder = roleplay
    ? "Hold the mic and knock, or type it."
    : mode.id === "mindset"
      ? "Your answer"
      : "What just happened?";

  return (
    <div
      className={
        embedded
          ? "flex min-h-0 flex-1 flex-col bg-paper"
          : "relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col bg-paper"
      }
    >
      <header className="shrink-0 border-b border-border/70 px-4 pt-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
            onClick={() => closeSheet()}
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted">
            <RoofusFace className="size-14" alt="" />
            <span className="font-medium text-fg">{pack.talkName}</span>
            <span className="text-faint">· {mode.label}</span>
          </div>
          <HelpButton page="coach" />
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <RoofusMark />
        <div className="relative z-10 flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4">
        {empty ? (
          mode.id === "mindset" ? (
            <MindsetStart onWalk={(id) => void startWalk(id)} />
          ) : (
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-faint">{mode.hint}</p>
              <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">{mode.label}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">{mode.use}</p>
              {mode.starters.length ? (
                <div className="mt-5 flex flex-col gap-2">
                  {mode.starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={roleplay && !practiceOn}
                      title={roleplay && !practiceOn ? PRACTICE_PLAN_COPY : undefined}
                      className={
                        roleplay && !practiceOn
                          ? "min-h-11 rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed text-faint opacity-50"
                          : "min-h-11 rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm leading-relaxed text-fg hover:bg-surface-2"
                      }
                      onClick={() => void onSend(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
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
              {roleplay &&
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
        {roleplay && empty ? (
          <RoleplayBar
            beat={beat}
            person={person}
            year={year}
            onBeat={setScene}
            onPerson={setWho}
            onYear={setYear}
            onKnock={() => void onSend(roleplayKnockLine(person, year, beat))}
          />
        ) : null}
        {roleplay && !empty && !busy ? (
          <>
            {!practiceOn ? <p className="mb-2 text-xs text-faint">{PRACTICE_PLAN_COPY}</p> : null}
            <button
              type="button"
              onClick={() => void onSend("score me")}
              disabled={!practiceOn}
              title={!practiceOn ? PRACTICE_PLAN_COPY : undefined}
              className={
                practiceOn
                  ? "mb-2 h-11 w-full rounded-full border border-border text-sm"
                  : "mb-2 h-11 w-full rounded-full border border-border bg-surface text-sm text-faint opacity-50"
              }
            >
              Score me
            </button>
          </>
        ) : null}
        <div className="flex items-center gap-2">
          <Tip label="Past chats">
            <button
              type="button"
              aria-label="Past chats"
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-2 hover:text-fg"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-5" />
            </button>
          </Tip>
          {roleplay ? (
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
              disabled={!draft.trim() || (roleplay && !practiceOn)}
              title={roleplay && !practiceOn ? PRACTICE_PLAN_COPY : undefined}
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

function MindsetStart({ onWalk }: { onWalk: (id: WalkId) => void }) {
  const mindset = modeById("mindset");
  return (
    <div className="mt-2">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{mindset.hint}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight">Mindset</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        One question at a time. Private. Never a porch line. What you wrote in Settings is his notes.
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
