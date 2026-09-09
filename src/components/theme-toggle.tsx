import { Moon, Sun } from "lucide-react";
import { useSettings } from "@/lib/settings-store";

export function ThemeToggle() {
  const theme = useSettings((s) => s.theme);
  const toggle = useSettings((s) => s.toggleTheme);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
      aria-label={dark ? "Switch to light" : "Switch to dark"}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
