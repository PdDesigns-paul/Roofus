import { createFileRoute, redirect } from "@tanstack/react-router";

/** Redirect organ. Keep one release. Cutoff: drop if nothing still links here. Living page is /after (Plan). Not a Place. */
export const Route = createFileRoute("/streets")({
  beforeLoad: () => {
    throw redirect({ to: "/after", replace: true });
  },
  component: () => null,
});
