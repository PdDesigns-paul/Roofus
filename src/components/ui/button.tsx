import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-fg text-paper hover:bg-fg/90",
        outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
      },
      size: {
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-sm",
        xl: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";
