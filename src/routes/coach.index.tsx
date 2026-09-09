import { createFileRoute } from "@tanstack/react-router";
import { RufusChat } from "@/components/rufus-chat";

export const Route = createFileRoute("/coach/")({
  codeSplitGroupings: [],
  component: CoachPage,
});

function CoachPage() {
  return <RufusChat />;
}
