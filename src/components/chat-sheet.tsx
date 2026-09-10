import { RufusChat } from "@/components/rufus-chat";
import { Sheet } from "@/components/sheet";
import { useCoach } from "@/lib/coach-store";

export function ChatSheet() {
  const open = useCoach((s) => s.sheetOpen);
  const closeSheet = useCoach((s) => s.closeSheet);

  return (
    <Sheet open={open} onClose={closeSheet} height="full" z={50}>
      <RufusChat embedded />
    </Sheet>
  );
}
