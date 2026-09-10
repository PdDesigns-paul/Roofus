import { GableMark } from "@/components/gable-mark";

export function AppHeader({ title }: { title: string }) {
  if (!title) return null;
  return (
    <header className="flex h-11 items-center">
      <div className="flex items-center gap-2 text-sm text-muted">
        <GableMark className="size-4" />
        {title}
      </div>
    </header>
  );
}
