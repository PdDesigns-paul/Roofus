import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { MindsetWorksheets } from "@/components/mindset-worksheets";

export const Route = createFileRoute("/settings/mindset")({
  codeSplitGroupings: [],
  component: MindsetPage,
});

function MindsetPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Mindset" />
      <div className="mt-5">
        <MindsetWorksheets />
      </div>
    </main>
  );
}
