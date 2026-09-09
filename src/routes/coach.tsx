import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/coach")({
  codeSplitGroupings: [],
  component: () => <Outlet />,
});
