import { createFileRoute, redirect } from "@tanstack/react-router";

/** Formerly Streets. Living page is /after. */
export const Route = createFileRoute("/streets")({
  beforeLoad: () => {
    throw redirect({ to: "/after", replace: true });
  },
  component: () => null,
});
