import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Sheet({
  open,
  onClose,
  children,
  z = 50,
  height = "auto",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  z?: number;
  height?: "auto" | "full";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 flex items-end justify-center bg-fg/40"
      style={{ zIndex: z }}
      data-no-pull
      onClick={onClose}
    >
      <div
        className={
          height === "full"
            ? "flex h-[95dvh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-paper shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
            : "max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
        }
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={height === "full" ? "flex shrink-0 justify-center pt-3" : ""}>
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </div>
  );

  // Pages use relative z-10. Without a portal the sheet loses to the tab bar and the FAB.
  return typeof document === "undefined" ? node : createPortal(node, document.body);
}
