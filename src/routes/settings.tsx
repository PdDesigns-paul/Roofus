import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { MindsetWorksheets } from "@/components/mindset-worksheets";
import { NotionBackup } from "@/components/notion-backup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDayBook } from "@/lib/day-book";
import { resetOnboard } from "@/lib/onboard";
import { REMINDERS } from "@/lib/reminders";
import { useReminders } from "@/lib/reminders-store";
import { enableLockScreen, isInstalledPwa, syncPushDrawer, testPing } from "@/lib/remind-client";
import { useNotion } from "@/lib/notion-store";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings")({
  codeSplitGroupings: [],
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSettings();
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);
  const navigate = useNavigate();
  const hash = useRouterState({ select: (st) => st.location.hash });

  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Presets" />

      <p className="mt-3 text-sm leading-snug text-muted">
        Counties, hours, company, warranty. Zips. Mindset. Reminders. Backup is optional.
      </p>

      <button
        type="button"
        className="mt-4 h-11 w-full rounded-full border border-border text-sm"
        onClick={() => {
          void navigate({ to: "/" });
          resetOnboard();
        }}
      >
        Show the question-mark tour
      </button>

      <section id="you" className="mt-5 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">You</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <Label htmlFor="goBy">First name</Label>
            <Input
              id="goBy"
              className="mt-1"
              value={profile.goBy}
              onChange={(e) => patchProfile({ goBy: e.target.value })}
              placeholder="What Roofus should call you"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              className="mt-1"
              value={s.companyName}
              onChange={(e) => {
                s.setCompanyName(e.target.value);
                patchProfile({ company: e.target.value });
              }}
              placeholder="Roofus"
            />
          </div>
        </div>
        <div className="min-w-0">
          <Label htmlFor="warranty">Warranty line</Label>
          <Input
            id="warranty"
            className="mt-1"
            value={s.warrantyLine}
            onChange={(e) => s.setWarrantyLine(e.target.value)}
          />
        </div>
      </section>

      <section id="territory" className="mt-5 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Counties</p>
        <div className="min-w-0">
          <Label htmlFor="counties">Which counties?</Label>
          <Input
            id="counties"
            className="mt-1"
            value={profile.counties}
            onChange={(e) => patchProfile({ counties: e.target.value })}
            placeholder="Where you actually knock"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="states">Which state?</Label>
          <Input
            id="states"
            className="mt-1"
            value={profile.states}
            onChange={(e) => patchProfile({ states: e.target.value })}
            placeholder="PA, Ohio, whatever you cover"
          />
        </div>
        <p className="text-xs leading-snug text-faint">
          Streets builds zips from these counties. Rebuild there if you change them.
        </p>
      </section>

      <section id="zips" className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Zips</p>
        <Link
          to="/streets"
          className="mt-2 flex min-h-14 flex-col justify-center border-b border-border py-3"
        >
          <span className="text-sm text-fg">Streets</span>
          <span className="text-xs text-faint">Age-band zip list. Rebuild after you change counties.</span>
        </Link>
      </section>

      <section id="hours" className="mt-5 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Hours</p>
        <div className="min-w-0">
          <Label htmlFor="knockWindow">When do you knock?</Label>
          <Input
            id="knockWindow"
            className="mt-1"
            value={profile.knockWindow}
            onChange={(e) => patchProfile({ knockWindow: e.target.value })}
            placeholder="After work, 3–4 hours"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="paperWindow">Morning work</Label>
          <Input
            id="paperWindow"
            className="mt-1"
            value={profile.paperWindow}
            onChange={(e) => patchProfile({ paperWindow: e.target.value })}
            placeholder="Calls and paperwork — not porches"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="hardStop">When do you stop?</Label>
          <Input
            id="hardStop"
            className="mt-1"
            value={profile.hardStop}
            onChange={(e) => patchProfile({ hardStop: e.target.value })}
            placeholder="When it gets dark"
          />
        </div>
      </section>

      <section id="mindset" className="mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Mindset</p>
        <MindsetWorksheets />
      </section>

      <section id="reminders" className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Reminders</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Open-app nags always work. Lock-screen pings need Notion — same secret as backup — and
          Roofus on your Home Screen. Without Notion, he can only tap you when you open the app.
        </p>
        <ReminderToggles />
      </section>

      <NotionBackup />
    </main>
  );
}

function ReminderToggles() {
  const on = useReminders((s) => s.on);
  const toggle = useReminders((s) => s.toggle);
  const connected = useNotion((s) => Boolean(s.token && s.ids));
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const installed = typeof window !== "undefined" && isInstalledPwa();

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setMsg(null);
    try {
      await fn();
      setMsg(label === "test" ? "Check the lock screen." : "This phone is on the list.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not ping.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3">
      {!connected ? (
        <p className="text-sm leading-relaxed text-muted">
          Connect Notion below or lock-screen stays off. Open-app nags still run.
        </p>
      ) : !installed ? (
        <p className="text-sm leading-relaxed text-muted">
          Add Roofus to your Home Screen, then Allow. Safari tabs cannot take pings.
        </p>
      ) : null}
      <ul className="mt-3 flex flex-col">
        {REMINDERS.map((r) => (
          <li key={r.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-border last:border-0 py-3">
            <span className="min-w-0">
              <span className="block text-sm text-fg">{r.label}</span>
              <span className="block text-xs text-faint">
                {r.when}. {r.hint}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={on[r.id]}
              className={`h-7 w-12 shrink-0 rounded-full ${on[r.id] ? "bg-accent" : "bg-surface-2"}`}
              onClick={() => {
                toggle(r.id);
                if (connected) void syncPushDrawer().catch(() => undefined);
              }}
            >
              <span className="sr-only">{on[r.id] ? "On" : "Off"}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2">
        <button
          type="button"
          disabled={!connected || Boolean(busy)}
          className="h-11 rounded-full bg-fg text-sm text-paper disabled:opacity-40"
          onClick={() => run("allow", enableLockScreen)}
        >
          {busy === "allow" ? "Asking…" : "Allow lock-screen pings"}
        </button>
        <button
          type="button"
          disabled={!connected || Boolean(busy)}
          className="h-11 rounded-full border border-border text-sm disabled:opacity-40"
          onClick={() => run("test", testPing)}
        >
          {busy === "test" ? "Sending…" : "Send a test ping"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
      <p className="mt-3 text-xs leading-relaxed text-faint">
        Morning and evening pings: GitHub → Settings → Secrets →{" "}
        <code className="text-[11px]">NOTION_TOKEN</code> and{" "}
        <code className="text-[11px]">NOTION_PAGE</code> (same secret and page link as above). Or
        Vercel env with those names. Without that, test ping still works while this page is open.
      </p>
    </div>
  );
}

