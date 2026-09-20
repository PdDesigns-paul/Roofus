import type { ReactNode } from "react";

/**
 * App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
 *
 *   <AuthProvider><Outlet /></AuthProvider>
 *
 * Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
 * its `useSession()` works standalone — so this is a passthrough today. Owner
 * chip + bookKey live without mounting /login. Bind a real host session only
 * when a later child turns `VITE_AUTH_ENABLED` on. Never the DEV_USER fallback.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
