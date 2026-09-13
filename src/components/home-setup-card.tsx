import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDayBook } from "@/lib/day-book";
import { dueReminders } from "@/lib/reminders";
import { useReminders } from "@/lib/reminders-store";
import { rowDone, SETUP_ROWS, setupScore, type SetupSnap } from "@/lib/setup-progress";

export function HomeSetupCard({
  snap,
  afterAction,
  stormFetchedOn,
  stackMonth,
}: {
  snap: SetupSnap;
  afterAction: string;
  stormFetchedOn: string;
  stackMonth: string;
}) {
  const emptyBook = !snap.goBy && !snap.company && !snap.counties && !snap.states;
  const [firstRun, setFirstRun] = useState(emptyBook);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("roofus-setup-hide") === "1",
  );
  const score = setupScore(snap);
  const on = useReminders((s) => s.on);
  const lastDone = useReminders((s) => s.lastDone);
  const markDone = useReminders((s) => s.markDone);
  const due = dueReminders({ on, lastDone }, snap, { afterAction, stormFetchedOn, stackMonth });
  const hideSetup = hidden && score.done === score.total;

  useEffect(() => {
    if (rowDone("territory", snap) || snap.zipCount > 0) {
      setFirstRun(false);
      setOpen(false);
    }
  }, [snap.counties, snap.states, snap.zipCount]);

  if (hideSetup && !due.length) return null;

  const pct = Math.round((score.done / score.total) * 100);
  const showFields = firstRun && !rowDone("territory", snap);

  return (
    <section className="mt-5">
      {due.length ? (
        <ul className="mb-4 flex flex-col gap-2">
          {due.map((r) => (
            <li key={r.id} className="flex min-h-11 items-center justify-between gap-2">
              <Link to={r.to} className="min-w-0 text-sm text-fg underline underline-offset-4">
                {r.label}
              </Link>
              <Chip onClick={() => markDone(r.id)}>Did it</Chip>
            </li>
          ))}
        </ul>
      ) : null}

      {hideSetup ? null : showFields ? (
        <FirstRunFields />
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-faint">Setup</p>
              <p className="mt-1 text-sm text-fg">
                {score.ready ? "Ready to knock." : "Counties first. Then you can knock."} {score.done} of{" "}
                {score.total}
              </p>
            </button>
            {score.done === score.total ? (
              <Chip
                onClick={() => {
                  localStorage.setItem("roofus-setup-hide", "1");
                  setHidden(true);
                }}
              >
                Hide
              </Chip>
            ) : null}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          {open ? (
            <ul className="mt-1 flex flex-col">
              {SETUP_ROWS.map((row) => (
                <li key={row.id}>
                  <GoRow to={row.path} label={row.label} hint={row.hint} done={rowDone(row.id, snap)} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}

function FirstRunFields() {
  const patchProfile = useDayBook((s) => s.patchProfile);
  const profile = useDayBook((s) => s.profile);

  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Setup</p>
      <p className="mt-1 text-sm text-fg">Name, company, counties. Then you can knock.</p>
      <div className="mt-3 flex flex-col gap-3">
        <div className="min-w-0">
          <Label htmlFor="home-goBy">First name</Label>
          <Input
            id="home-goBy"
            className="mt-1"
            value={profile.goBy}
            onChange={(e) => patchProfile({ goBy: e.target.value })}
            placeholder="What Roofus should call you"
            autoComplete="given-name"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="home-company">Company</Label>
          <Input
            id="home-company"
            className="mt-1"
            value={profile.company}
            onChange={(e) => patchProfile({ company: e.target.value })}
            placeholder="The name on the truck"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <Label htmlFor="home-counties">Counties</Label>
            <Input
              id="home-counties"
              className="mt-1"
              value={profile.counties}
              onChange={(e) => patchProfile({ counties: e.target.value })}
              placeholder="Where you knock"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="home-states">State</Label>
            <Input
              id="home-states"
              className="mt-1"
              value={profile.states}
              onChange={(e) => patchProfile({ states: e.target.value })}
              placeholder="PA"
            />
          </div>
        </div>
      </div>
      <GoRow to="/settings" label="More" hint="Hours, warranty, Why, website" done={false} />
    </div>
  );
}

function GoRow({
  to,
  label,
  hint,
  done,
}: {
  to: "/settings/you" | "/settings/territory" | "/after" | "/settings/hours" | "/settings/mindset" | "/settings";
  label: string;
  hint: string;
  done: boolean;
}) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 border-b border-border last:border-0 py-3">
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
          done ? "border-accent bg-accent" : "border-border text-faint"
        }`}
        aria-hidden
      >
        {done ? "✓" : ""}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm text-fg">{label}</span>
        <span className="text-xs text-faint">{hint}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-faint" />
    </Link>
  );
}
