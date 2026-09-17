import { createFileRoute, redirect } from "@tanstack/react-router";

/** Redirect organ. Keep one release. Cutoff: drop if nothing still links here. Living page is /roof. Not a Place. */
export const Route = createFileRoute("/coach/inspect")({
  beforeLoad: () => {
    throw redirect({ to: "/roof", replace: true });
  },
  component: () => null,
});
