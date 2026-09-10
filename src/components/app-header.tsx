import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GableMark } from "@/components/gable-mark";
import { HelpButton } from "@/components/help-button";
import { MoreMenu } from "@/components/more-menu";
import type { HelpPageId } from "@/lib/page-help";

export function AppHeader({
  title,
  backTo = "/",
  page,
  home = false,
}: {
  title: string;
  backTo?: string;
  page: HelpPageId;
  home?: boolean;
}) {
  return (
    <header className="flex items-center justify-between">
      {home ? (
        <div className="inline-flex size-11 items-center justify-center text-muted">
          <GableMark className="size-4" />
        </div>
      ) : (
        <Link
          to={backTo}
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
      )}
      <div className="flex items-center gap-2 text-sm text-muted">
        {home ? null : <GableMark className="size-4" />}
        {title}
      </div>
      <div className="flex items-center">
        <HelpButton page={page} />
        <MoreMenu />
      </div>
    </header>
  );
}
