import { useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GableMark } from "@/components/gable-mark";
import { HelpButton } from "@/components/help-button";
import { MoreMenu } from "@/components/more-menu";
import { helpPageFor, showBack } from "@/lib/app-chrome";

export function AppHeader({ title }: { title: string }) {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nested = showBack(path);
  const page = helpPageFor(path);

  return (
    <header className="flex h-11 items-center gap-1">
      {nested ? (
        <button
          type="button"
          aria-label="Back"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted"
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="size-5" />
        </button>
      ) : null}
      {title ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
          <GableMark className="size-4 shrink-0" />
          <span className="truncate">{title}</span>
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      <HelpButton page={page} />
      <MoreMenu />
    </header>
  );
}
