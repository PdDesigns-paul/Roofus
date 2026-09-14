import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, DoorOpen, Map, Truck } from "lucide-react";

const TABS = [
  {
    to: "/truck",
    id: "truck",
    label: "Truck",
    icon: Truck,
    match: (p: string) => p === "/truck" || p === "/today" || p === "/",
  },
  {
    to: "/door",
    id: "door",
    label: "Door",
    icon: DoorOpen,
    match: (p: string) => p.startsWith("/door") || p.startsWith("/coach/cards"),
  },
  {
    to: "/roof",
    id: "roof",
    label: "Roof",
    icon: Camera,
    match: (p: string) => p.startsWith("/roof") || p.startsWith("/coach/inspect"),
  },
  {
    to: "/after",
    id: "after",
    label: "Prep",
    icon: Map,
    match: (p: string) => p.startsWith("/after") || p.startsWith("/streets"),
  },
] as const;

export function TabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-paper/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav>
        <ul className="mx-auto grid max-w-lg grid-cols-4">
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
