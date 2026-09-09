import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/house")({
  codeSplitGroupings: [],
  component: () => <Outlet />,
});
