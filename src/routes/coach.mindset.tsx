import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/coach/mindset")({
  codeSplitGroupings: [],
  beforeLoad: () => {
    throw redirect({ to: "/settings/mindset" });
  },
  component: () => null,
});
