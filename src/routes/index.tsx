import { createFileRoute } from "@tanstack/react-router";
import { TodayJournal } from "./today";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  component: TodayJournal,
});
