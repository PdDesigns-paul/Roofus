import { useNavigate, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus } from "lucide-react";
import { Tip } from "@/components/ui/tooltip";
import { useCoach } from "@/lib/coach-store";

export function AskFab() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const startNew = useCoach((s) => s.startNew);
  if (path === "/coach" || path === "/coach/") return null;

  return (
    <Tip label="New chat with Roofus" side="left">
      <button
        type="button"
        aria-label="New chat with Roofus"
        className="fixed bottom-6 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-fg text-paper shadow-lg hover:bg-fg/90"
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        onClick={() => {
          startNew();
          void navigate({ to: "/coach" });
        }}
      >
        <MessageSquarePlus className="size-6" />
      </button>
    </Tip>
  );
}
