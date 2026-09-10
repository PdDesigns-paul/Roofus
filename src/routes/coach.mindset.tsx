import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { useDayBook } from "@/lib/day-book";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";
import { COMPASS, WALKS, walkKickoff, type WalkId } from "@/lib/survive";
import {
  demonFilled,
  paceFilled,
  stackFilled,
  useSurvive,
  whyFilled,
  type SurviveState,
} from "@/lib/survive-store";

export const Route = createFileRoute("/coach/mindset")({
  codeSplitGroupings: [],
  component: MindsetPage,
});

function MindsetPage() {
  const [open, setOpen] = useState<WalkId | null>(null);
  const survive = useSurvive();
  const profile = useDayBook((s) => s.profile);
  const status: Record<WalkId, boolean> = {
    why: whyFilled(survive),
    demon: demonFilled(survive),
    pace: paceFilled(survive, profile.knockWindow),
    stack: stackFilled(survive),
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Mindset" page="mindset" />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">Stay in the fight.</h1>
      <p className="mt-2 text-sm leading-snug text-muted">
        Most first-year roofers do not fail because they cannot sell. They fail because they cannot
        stand themselves when it gets hard. This page is that fight. After Action Report lives on
        Today.
      </p>

      <section className="mt-4 rounded-2xl border border-border px-3 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Compass</p>
        <ul className="mt-3 flex flex-col gap-2">
          {COMPASS.map((line) => (
            <li key={line} className="text-sm leading-relaxed text-muted">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <Link
        to="/today"
        className="mt-4 flex min-h-14 items-center justify-between rounded-2xl border border-border px-4 text-sm"
      >
        <span>3 · After Action Report</span>
        <span className="text-muted">Today</span>
      </Link>

      <ul className="mt-4 flex flex-col gap-3">
        {WALKS.map((w) => (
          <li key={w.id}>
            <button
              type="button"
              onClick={() => setOpen((cur) => (cur === w.id ? null : w.id))}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
                {w.n}
                {status[w.id] ? " · written" : whyFilled(survive) || w.id !== "why" ? "" : " · start here"}
              </p>
              <p className="mt-1 font-display text-xl tracking-tight">{w.title}</p>
              <p className="mt-1 text-xs text-muted">{w.when}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.blurb}</p>
            </button>
            {open === w.id ? <WalkSheet id={w.id} /> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

function WalkSheet({ id }: { id: WalkId }) {
  const survive = useSurvive();
  const profile = useDayBook((s) => s.profile);
  const patchProfile = useDayBook((s) => s.patchProfile);
  const [err, setErr] = useState<string | null>(null);

  function walk() {
    setErr(null);
    const sheet = WALKS.find((w) => w.id === id);
    whenCoachReady(() => {
      abortTalk();
      useCoach.getState().startNew({
        hat: "mindset",
        origin: "mindset",
        walkId: id,
        title: sheet?.title ?? "Mindset",
      });
      useCoach.getState().openSheet();
      void (async () => {
        try {
          await sendRoofus(walkKickoff(id), { kickoff: true });
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Roofus missed that.");
        }
      })();
    });
  }

  return (
    <div className="border-x border-b border-border px-4 pb-4 pt-3">
      {id === "why" ? <WhyFields s={survive} /> : null}
      {id === "demon" ? <DemonFields s={survive} /> : null}
      {id === "pace" ? (
        <PaceFields
          s={survive}
          knock={profile.knockWindow}
          paper={profile.paperWindow}
          stop={profile.hardStop}
          onHours={(p) => patchProfile(p)}
        />
      ) : null}
      {id === "stack" ? <StackFields s={survive} /> : null}
      <button
        type="button"
        onClick={walk}
        className="mt-4 h-12 w-full rounded-full bg-fg text-sm text-paper"
      >
        Coach me through this
      </button>
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  area,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  area?: boolean;
}) {
  return (
    <label className="mt-2 block min-w-0">
      <span className="text-xs text-muted">{label}</span>
      {area ? (
        <textarea
          className="mt-1 min-h-16 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="mt-1 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

function WhyFields({ s }: { s: SurviveState }) {
  const patch = s.patch;
  return (
    <>
      <Field label="I have earned" value={s.earned} onChange={(v) => patch({ earned: v })} hint="Write it as if it already happened." />
      <Field label="By" value={s.byDate} onChange={(v) => patch({ byDate: v })} />
      <Field label="Why that number?" value={s.why1} onChange={(v) => patch({ why1: v })} area />
      <Field label="Why does that matter?" value={s.why2} onChange={(v) => patch({ why2: v })} area />
      <Field label="Why do you care that much?" value={s.why3} onChange={(v) => patch({ why3: v })} area />
    </>
  );
}

function DemonFields({ s }: { s: SurviveState }) {
  return (
    <>
      <p className="text-xs text-faint">Private. Not a door line.</p>
      <Field label="Its name" value={s.demon} onChange={(v) => s.patch({ demon: v })} hint="One word is enough." />
      <Field label="Where it started" value={s.origin} onChange={(v) => s.patch({ origin: v })} area />
    </>
  );
}

function PaceFields({
  s,
  knock,
  paper,
  stop,
  onHours,
}: {
  s: SurviveState;
  knock: string;
  paper: string;
  stop: string;
  onHours: (p: { knockWindow?: string; paperWindow?: string; hardStop?: string }) => void;
}) {
  return (
    <>
      <Field label="When I knock" value={knock} onChange={(v) => onHours({ knockWindow: v })} />
      <Field label="Paper hours" value={paper} onChange={(v) => onHours({ paperWindow: v })} />
      <Field label="Hard stop" value={stop} onChange={(v) => onHours({ hardStop: v })} />
      <Field
        label="Real off-block"
        value={s.offBlock}
        onChange={(v) => s.patch({ offBlock: v })}
        hint="A night, a Sunday, a weekend. Rest is work."
      />
      <Field label="Phone goes down" value={s.phoneDown} onChange={(v) => s.patch({ phoneDown: v })} />
    </>
  );
}

function StackFields({ s }: { s: SurviveState }) {
  return (
    <>
      <Field label="Month" value={s.stackMonth} onChange={(v) => s.patch({ stackMonth: v })} />
      <Field label="Skill I’m stacking" value={s.skill} onChange={(v) => s.patch({ skill: v })} />
      <Field label="Daily drill" value={s.drill} onChange={(v) => s.patch({ drill: v })} area />
    </>
  );
}
