import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { settingsHashPath } from "@/lib/setup-progress";

export const Route = createFileRoute("/settings")({
  codeSplitGroupings: [],
  beforeLoad: ({ location }) => {
    const to = settingsHashPath(location.hash);
    if (!to) return;
    const here = location.pathname.replace(/\/$/, "") || "/";
    if (here === to && !location.hash) return;
    throw redirect({ to, replace: true });
  },
  component: () => <Outlet />,
});
