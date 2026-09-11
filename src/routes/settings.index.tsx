import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { useDayBook } from "@/lib/day-book";
import { loadDemo } from "@/lib/demo-data";
import { resetOnboard } from "@/lib/onboard";

export const Route = createFileRoute("/settings/")({
  codeSplitGroupings: [],
  component: SettingsIndex,
});

const PAGES = [
  { to: "/settings/you", label: "You", hint: "First name, company, website, warranty" },
  { to: "/settings/territory", label: "Territory", hint: "Counties and state" },
  { to: "/streets", label: "Streets", hint: "Park-once loops from those counties" },
  { to: "/storms", label: "Storms", hint: "Kept pins. Last 48 hours. Age first." },
  { to: "/settings/hours", label: "Hours", hint: "When you knock" },
  { to: "/settings/mindset", label: "Mindset", hint: "Why, demon, Pace, stack" },
  { to: "/settings/reminders", label: "Reminders", hint: "The four nags" },
  { to: "/settings/backup", label: "Backup", hint: "Optional Notion copy. Memory FAQs." },
] as const;

function SettingsIndex() {
  const navigate = useNavigate();

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Presets" />

      <p className="mt-3 text-sm leading-snug text-muted">
        You, territory, hours. Streets. Storms. Mindset. Reminders. Backup is optional.
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
      <LoadSample />

      <ul className="mt-5 flex flex-col">
        {PAGES.map((p) => (
          <li key={p.to} className="border-b border-border last:border-0">
            <Link to={p.to} className="flex min-h-14 flex-col justify-center py-3">
              <span className="text-sm text-fg">{p.label}</span>
              <span className="text-xs text-faint">{p.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function LoadSample() {
  const counties = useDayBook((s) => s.profile.counties);
  const navigate = useNavigate();
  if (counties.trim()) return null;
  return (
    <button
      type="button"
      className="mt-2 h-11 w-full rounded-full border border-border text-sm"
      onClick={() => {
        loadDemo();
        void navigate({ to: "/streets" });
      }}
    >
      Load a sample day
    </button>
  );
}
