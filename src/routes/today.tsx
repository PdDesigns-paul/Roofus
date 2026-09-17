import { createFileRoute, redirect } from "@tanstack/react-router";

/** Redirect organ. Keep one release. Living page is /truck (Today). Not a second Place. */
export const Route = createFileRoute("/today")({
  beforeLoad: () => {
    throw redirect({ to: "/truck", replace: true });
  },
  component: () => null,
});
