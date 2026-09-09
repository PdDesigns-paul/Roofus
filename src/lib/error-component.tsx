import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fg px-6 text-center text-paper">
      <span className="text-accent" aria-hidden>
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl">Something broke</h1>
      <p className="max-w-md text-sm break-words text-paper/60">
        {error.message || "Reload and try again."}
      </p>
      <a
        href="/"
        className="mt-2 inline-flex h-12 items-center rounded-full bg-paper px-6 text-sm font-medium text-fg"
      >
        Back to home
      </a>
    </main>
  );
}