import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useNotion } from "@/lib/notion-store";

/** Settings, or first empty book on Today. Not a standing Today card. */
export function NotionHint() {
  const connected = useNotion((s) => Boolean(s.ids && s.token));
  const hidden = useNotion((s) => s.hintHidden);
  const hide = useNotion((s) => s.hideHint);
  if (connected || hidden) return null;
  return (
    <div className="mt-6 rounded-2xl border border-border px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Recommended</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Copy this phone in Backup — a file, or Notion if the office uses it. Optional.
      </p>
      <div className="mt-3 flex gap-2">
        <Button asChild className="flex-1">
          <Link to="/settings/backup">Go to Backup</Link>
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={hide}>
          Not now
        </Button>
      </div>
    </div>
  );
}
