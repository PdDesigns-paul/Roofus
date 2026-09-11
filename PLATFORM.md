# Platform leftover — do not call from product code

Roofus is a **local journal**. Days, streets, storms, and mindset live in
`localStorage` / Zustand. Notion backup is optional and stays on the phone.
There is no login and no app database.

Grok’s scaffold still ships organs the host expects at these paths. They stay
so deploy / preview do not break. **Do not import them from `src/routes/` or
from porch stores.**

| Path | Why it is still here | Product rule |
| --- | --- | --- |
| `src/lib/auth/` | `__root.tsx` mounts `AuthProvider` (a passthrough). Vite serves `/auth/popup` in preview. | Do not add `/login` or `/api/auth`. Do not import `better-auth` from a route. |
| `src/lib/db.ts` | Vite’s preview plugin can load it. | Do not `getSql()`. The journal is not Postgres. |
| `src/lib/app-data/` | Grok connector gate for other apps. | Not the day book. |
| `scripts/migrate.mjs` (`db:migrate`) | Host leftover for apps that turn a database on. | **Not** chained to `npm run build`. |
| `migrations/auth/` | Better Auth schema on the shelf. | Do not copy it up unless they ask for accounts. |
| `scripts/check-auth-invariant.mjs` | Preview vs build flag check. | Not a product test. CI runs `test:app`. |

`npm run build` is Vite only. It must not talk to Postgres or PGLite.

If a real backend is ever the job, that is Prep to Launch — a new slice, not
quietly wiring these files.
