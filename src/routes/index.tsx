import { createFileRoute, redirect } from "@tanstack/react-router";

/** Formerly Home (porch). First Place is Truck. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/truck", replace: true });
  },
  component: () => null,
});
