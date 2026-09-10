import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { useDayBook, localDateKey } from "@/lib/day-book";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";
import {
  ATTACKS,
  COMPASS,
  GEARS,
  STACK_SKILLS,
  WALKS,
  parseSkills,
  toggleSkill,
  walkKickoff,
  walkReadWhy,
  whyRecap,
  type AttackId,
  type GearId,
  type WalkId,
} from "@/lib/survive";
import {
  demonFilled,
  paceFilled,
  stackFilled,
  useSurvive,
  whyFilled,
  type SurviveState,
} from "@/lib/survive-store";

export function MindsetWorksheets() {
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
    <div>
      <h2 className="font-display text-2xl leading-tight tracking-tight">Stay in the fight.</h2>
      <p className="mt-2 text-sm leading-snug text-muted">
        Most first-year roofers do not fail because they cannot sell. They fail because they cannot
        stand themselves when it gets hard. This page is that fight. After Action Report lives on
        Today. The orange fan opens the chat.
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
        <span className="text-muted">Today · wins first</span>
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
    </div>
  );
}

function WalkSheet({ id }: { id: WalkId }) {
  const survive = useSurvive();
  const profile = useDayBook((s) => s.profile);
  const patchProfile = useDayBook((s) => s.patchProfile);
  const [err, setErr] = useState<string | null>(null);

  function walk(kickoff: string, title?: string) {
    setErr(null);
    const sheet = WALKS.find((w) => w.id === id);
    whenCoachReady(() => {
      abortTalk();
      useCoach.getState().startNew({
        mode: "mindset",
        origin: "mindset",
        walkId: id,
        title: title ?? sheet?.title ?? "Mindset",
      });
      useCoach.getState().openSheet();
      void (async () => {
        try {
          await sendRoofus(kickoff, { kickoff: true });
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Roofus missed that.");
        }
      })();
    });
  }

  return (
    <div className="border-x border-b border-border px-4 pb-4 pt-3">
      {id === "why" ? <WhyFields s={survive} onRead={() => walk(walkReadWhy(), "Read my why")} /> : null}
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
        onClick={() => walk(walkKickoff(id))}
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

function WhyFields({ s, onRead }: { s: SurviveState; onRead: () => void }) {
  const patch = s.patch;
  const recap = whyRecap(s);

  function setEarned(v: string) {
    patch({ earned: v, ...(s.writtenOn.trim() || !v.trim() ? {} : { writtenOn: localDateKey() }) });
  }

  return (
    <>
      {recap ? (
        <div className="rounded-2xl border border-border bg-paper px-3 py-3">
          <p className="text-sm leading-relaxed">{recap}</p>
          <button
            type="button"
            onClick={onRead}
            className="mt-3 h-11 w-full rounded-full border border-border text-sm"
          >
            Read it with Roofus
          </button>
        </div>
      ) : (
        <p className="text-xs text-faint">
          Stop on the answer that still hurts a little. Dead day: read this out loud in the truck before you
          drive home.
        </p>
      )}
      <Field
        label="I have earned"
        value={s.earned}
        onChange={setEarned}
        hint="Write it as if it already happened."
      />
      <Field label="By" value={s.byDate} onChange={(v) => patch({ byDate: v })} />
      <Field
        label="What does that number buy?"
        value={s.why1}
        onChange={(v) => patch({ why1: v })}
        hint="Not “because it is a lot.” Real life."
        area
      />
      <Field
        label="Who else is on the other side?"
        value={s.why2}
        onChange={(v) => patch({ why2: v })}
        area
      />
      <Field
        label="Why do you care that much?"
        value={s.why3}
        onChange={(v) => patch({ why3: v })}
        hint="A person, a promise, or a version of you."
        area
      />
      {s.writtenOn ? <p className="mt-2 text-xs text-faint">Written {s.writtenOn}. Check it in 90 days.</p> : null}
    </>
  );
}

function DemonFields({ s }: { s: SurviveState }) {
  const attack = ATTACKS.find((a) => a.id === s.attack);
  return (
    <>
      <p className="text-xs text-faint">Private. Not a door line.</p>
      <Field label="Its name" value={s.demon} onChange={(v) => s.patch({ demon: v })} hint="One word is enough." />
      <Field
        label="Where it started"
        value={s.origin}
        onChange={(v) => s.patch({ origin: v })}
        hint="A house, a job, a person, a year."
        area
      />
      <Field
        label="If this radar helped a homeowner"
        value={s.radar}
        onChange={(v) => s.patch({ radar: v })}
        hint="Same fear, used to connect, not to hide."
        area
      />
      <p className="mt-3 text-xs text-muted">Which attack showed up this week?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ATTACKS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => s.patch({ attack: a.id as AttackId })}
            className={
              s.attack === a.id
                ? "min-h-11 rounded-full bg-fg px-3 text-sm text-paper"
                : "min-h-11 rounded-full border border-border bg-surface px-3 text-sm"
            }
          >
            {a.label}
          </button>
        ))}
      </div>
      {attack ? <p className="mt-2 text-xs text-faint">{attack.fix}</p> : null}
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
      <p className="text-xs text-faint">Hours also live above. You train people when you reply late.</p>
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
      <p className="mt-3 text-xs text-muted">This week I was in which gear?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {GEARS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => s.patch({ gear: g as GearId })}
            className={
              s.gear === g
                ? "min-h-11 rounded-full bg-fg px-3 text-sm text-paper"
                : "min-h-11 rounded-full border border-border bg-surface px-3 text-sm"
            }
          >
            {g}
          </button>
        ))}
      </div>
      <Field
        label="What I will drop so I last"
        value={s.drop}
        onChange={(v) => s.patch({ drop: v })}
        area
      />
      <Field
        label="Already have"
        value={s.alreadyHave}
        onChange={(v) => s.patch({ alreadyHave: v })}
        hint="One thing last-year-you wanted. Say it before the first knock."
        area
      />
    </>
  );
}

function StackFields({ s }: { s: SurviveState }) {
  const picked = parseSkills(s.skill);
  return (
    <>
      <Field label="Month" value={s.stackMonth} onChange={(v) => s.patch({ stackMonth: v })} />
      <p className="mt-3 text-xs text-muted">Three skills this month.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STACK_SKILLS.map((name) => {
          const on = picked.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => s.patch({ skill: toggleSkill(s.skill, name) })}
              className={
                on
                  ? "min-h-11 rounded-full bg-fg px-3 text-sm text-paper"
                  : "min-h-11 rounded-full border border-border bg-surface px-3 text-sm"
              }
            >
              {name}
            </button>
          );
        })}
      </div>
      <Field
        label="Tiny first drill"
        value={s.drill}
        onChange={(v) => s.patch({ drill: v })}
        hint="Treat reps like free throws, not a new career."
        area
      />
      <Field
        label="Windshield this week"
        value={s.windshield}
        onChange={(v) => s.patch({ windshield: v })}
        hint="Audio while you drive. Learning belongs here, not after you are fried."
      />
      <Field
        label="Night book"
        value={s.nightBook}
        onChange={(v) => s.patch({ nightBook: v })}
        hint="A person, not work, or the mind races."
      />
    </>
  );
}
