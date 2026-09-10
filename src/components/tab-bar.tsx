import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Camera, Home, Map } from "lucide-react";
import { HelpButton } from "@/components/help-button";
import { MoreMenu } from "@/components/more-menu";
import { helpPageFor, showBackHome } from "@/lib/app-chrome";

const TABS = [
  { to: "/today", id: "today", label: "Today", icon: CalendarDays, match: (p: string) => p === "/today" },
  { to: "/streets", id: "streets", label: "Streets", icon: Map, match: (p: string) => p.startsWith("/streets") },
  {
    to: "/coach/inspect",
    id: "inspect",
    label: "Inspect",
    icon: Camera,
    match: (p: string) => p.startsWith("/coach/inspect"),
  },
] as const;

export function TabBar() {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nested = showBackHome(path);
  const page = helpPageFor(path);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-paper/95 backdrop-blur"
      data-tour="tabs"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 border-b border-border">
        {nested ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Back"
            onClick={() => router.history.back()}
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <span />
        )}
        {nested ? (
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Home"
          >
            <Home className="size-5" />
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center justify-center">
          <HelpButton page={page} />
        </div>
        <div className="flex items-center justify-center">
          <MoreMenu />
        </div>
      </div>
      <nav>
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {TABS.map((tab) => {
            const on = tab.match(path);
            const Icon = tab.icon;
            return (
              <li key={tab.id}>
                <Link
                  to={tab.to}
                  className={
                    on
                      ? "flex min-h-12 flex-col items-center justify-center gap-0.5 pt-1.5 text-fg"
                      : "flex min-h-12 flex-col items-center justify-center gap-0.5 pt-1.5 text-faint"
                  }
                  aria-current={on ? "page" : undefined}
                >
                  <Icon className="size-5" strokeWidth={on ? 2.2 : 1.8} />
                  <span className="text-[11px] font-medium">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
