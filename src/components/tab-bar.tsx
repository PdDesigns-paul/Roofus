import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Camera, Home } from "lucide-react";

const TABS = [
  { to: "/today", id: "today", label: "Today", icon: CalendarDays, match: (p: string) => p === "/today" },
  {
    to: "/coach/inspect",
    id: "inspect",
    label: "Inspect",
    icon: Camera,
    match: (p: string) => p.startsWith("/coach/inspect"),
  },
  { to: "/", id: "home", label: "Home", icon: Home, match: (p: string) => p === "/" },
] as const;

export function TabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-paper/95 backdrop-blur"
      data-tour="tabs"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
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
