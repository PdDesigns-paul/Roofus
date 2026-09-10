import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { NotionBackup } from "@/components/notion-backup";

export const Route = createFileRoute("/settings/backup")({
  codeSplitGroupings: [],
  component: BackupPage,
});

function BackupPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Backup" />
      <p className="mt-5 text-sm leading-relaxed text-muted">
        Do not Restore onto a full phone. Do not Backup from an empty one.
      </p>
      <NotionBackup />
    </main>
  );
}
