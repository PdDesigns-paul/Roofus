import { createFileRoute, redirect } from "@tanstack/react-router";

/** Formerly the Today journal. Living page is /truck. */
export const Route = createFileRoute("/today")({
  beforeLoad: () => {
    throw redirect({ to: "/truck", replace: true });
  },
  component: () => null,
});
