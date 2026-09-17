import { createFileRoute, redirect } from "@tanstack/react-router";

/** Redirect organ. Keep one release. Cutoff: drop if nothing still links here. Living page is /door. Not a Place. */
export const Route = createFileRoute("/coach/cards")({
  beforeLoad: () => {
    throw redirect({ to: "/door", replace: true });
  },
  component: () => null,
});
