import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { InstallHint } from "@/components/install-hint";
import { NotionHint } from "@/components/notion-hint";
import { Button } from "@/components/ui/button";
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
  { to: "/settings/hours", label: "Hours", hint: "When you knock" },
  { to: "/settings/mindset", label: "Mindset", hint: "Why, demon, Pace, stack" },
  { to: "/settings/reminders", label: "Reminders", hint: "The four nags" },
  { to: "/settings/backup", label: "Backup", hint: "Optional Notion copy. Memory FAQs." },
] as const;

function SettingsIndex() {
  const navigate = useNavigate();

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Settings" />

      <ul className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface px-4">
        {PAGES.map((p) => (
          <li key={p.to} className="border-b border-border last:border-0">
            <Link to={p.to} className="flex min-h-14 items-center gap-3 py-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm text-fg">{p.label}</span>
                <span className="text-xs text-muted">{p.hint}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            void navigate({ to: "/truck" });
            resetOnboard();
          }}
        >
          Show the tour
        </Button>
        <LoadSample />
      </div>

      <InstallHint />
      <NotionHint />
    </main>
  );
}

function LoadSample() {
  const counties = useDayBook((s) => s.profile.counties);
  const navigate = useNavigate();
  if (counties.trim()) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={() => {
        loadDemo();
        void navigate({ to: "/after" });
      }}
    >
      Load a sample day
    </Button>
  );
}
