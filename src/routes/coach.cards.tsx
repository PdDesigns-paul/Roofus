import { createFileRoute, redirect } from "@tanstack/react-router";

/** Formerly Cards. Living page is /door. */
export const Route = createFileRoute("/coach/cards")({
  beforeLoad: () => {
    throw redirect({ to: "/door", replace: true });
  },
  component: () => null,
});
