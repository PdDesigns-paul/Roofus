import { Link, useRouterState } from "@tanstack/react-router";
import { Camera, DoorOpen, Map } from "lucide-react";
import { PickupTruck } from "@/components/pickup-truck";
import { pack } from "@/lib/tenant";

const TABS = [
  {
    to: "/truck",
    id: "truck",
    label: pack.places.today,
    icon: PickupTruck,
    match: (p: string) => p === "/truck" || p === "/today" || p === "/",
  },
  {
    to: "/door",
    id: "door",
    label: pack.places.door,
    icon: DoorOpen,
    match: (p: string) => p.startsWith("/door") || p.startsWith("/coach/cards"),
  },
  {
    to: "/roof",
    id: "roof",
    label: pack.places.inspect,
    icon: Camera,
    match: (p: string) => p.startsWith("/roof") || p.startsWith("/coach/inspect"),
  },
  {
    to: "/after",
    id: "after",
    label: pack.places.plan,
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
