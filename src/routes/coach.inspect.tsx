import { createFileRoute, redirect } from "@tanstack/react-router";

/** Formerly Inspect. Living page is /roof. */
export const Route = createFileRoute("/coach/inspect")({
  beforeLoad: () => {
    throw redirect({ to: "/roof", replace: true });
  },
  component: () => null,
});
