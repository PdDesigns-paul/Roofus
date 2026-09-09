import { useNavigate } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { Tip } from "@/components/ui/tooltip";
import { abortTalk } from "@/lib/roofus-talk";
import { useCoach, whenCoachReady } from "@/lib/coach-store";
import type { HelpPageId } from "@/lib/page-help";

export function HelpButton({ page }: { page: HelpPageId }) {
  const navigate = useNavigate();
  const startHelp = useCoach((s) => s.startHelp);

  return (
    <Tip label="Ask Roofus about this page">
      <button
        type="button"
        aria-label="Ask Roofus about this page"
        className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
        onClick={() => {
          whenCoachReady(() => {
            abortTalk();
            startHelp(page);
            void navigate({ to: "/coach" });
          });
        }}
      >
        <CircleHelp className="size-5" />
      </button>
    </Tip>
  );
}
