import { Check } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Toggle a token. Idle outline, selected = flat accent fill. No third variant. */
export const Chip = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }
>(({ className, selected = false, children, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-pressed={selected}
    className={cn(
      "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
      selected ? "bg-accent" : "border border-border bg-transparent text-fg",
      className,
    )}
    {...props}
  >
    {selected ? <Check className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden /> : null}
    {children}
  </button>
));
Chip.displayName = "Chip";
