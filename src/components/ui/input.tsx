import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-border bg-surface px-4 text-base text-fg outline-none placeholder:text-faint focus:border-fg",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";