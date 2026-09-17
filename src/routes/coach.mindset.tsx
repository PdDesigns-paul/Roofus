import { createFileRoute, redirect } from "@tanstack/react-router";

/** Redirect organ. Keep one release. Cutoff: drop if nothing still links here. Living page is /settings/mindset. Not a Place. */
export const Route = createFileRoute("/coach/mindset")({
  codeSplitGroupings: [],
  beforeLoad: () => {
    throw redirect({ to: "/settings/mindset" });
  },
  component: () => null,
});
