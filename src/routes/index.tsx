import { createFileRoute, redirect } from "@tanstack/react-router";

/** Redirect organ. First Place is Today (file truck.tsx). */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/truck", replace: true });
  },
  component: () => null,
});
