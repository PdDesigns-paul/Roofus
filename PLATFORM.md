# Platform leftover — host organs

The phone book stays **local-first**. Days, streets, storms, pins, and mindset
live in `localStorage` / Zustand. Cloud is a copy (JSON file on the phone;
optional Notion). The journal must stay writable offline. Do not make Postgres the live
book.

Grok’s scaffold still ships organs the host expects at these paths. They stay
so deploy / preview do not break. **Do not import them from `src/routes/` or
from porch stores until a named child lights them.**

| Path | Why it is still here | When it may light up |
| --- | --- | --- |
| `src/lib/auth/` | `__root.tsx` mounts `AuthProvider` (a passthrough). Vite serves `/auth/popup` in preview. | **WL-7** shipped `ownerId` / `ownerLabel` on You and `bookKey()` on the journal stores. `ownerFromSession` binds a real host id only — never the disabled-auth `DEV_USER` (that would rename every persist key). `VITE_AUTH_ENABLED` stays false. Still no `/login` Place. Still no UserButton. Do not import `better-auth` from a Place route. |
| `src/lib/db.ts` | Vite’s preview plugin can load it. | **Prep-to-Launch** — office copy / crew backup, never the phone’s source of truth. Until then: do not `getSql()`. |
| `src/lib/app-data/` | Grok connector gate for other apps. | Not the day book. Leave dark. |
| `scripts/migrate.mjs` (`db:migrate`) | Host leftover for apps that turn a database on. | **Not** chained to `npm run build`. Prep-to-Launch may use it. |
| `migrations/auth/` | Better Auth schema on the shelf. | Copy up only when WL-7 / Prep-to-Launch says accounts. Not a login Place. |
| `scripts/check-auth-invariant.mjs` | Preview vs build flag check. | Not a product test. CI runs `test:app`. |

`npm run build` is Vite only. It must not talk to Postgres or PGLite.

`VITE_AUTH_ENABLED` stays false on Roofus. Stripe / paywall chrome never. A sixth Place never.

Pack id is `VITE_TENANT_ID` at build. Proof ids (`pest`, `solar`, `demo`) win so proof builds stay honest. Shared prod (env empty or default `roofus`): host allowlist then `roofus`. `roofus.coach` stays pack `roofus`. Documented proof host `stride.example` → `solar`. grok.me is not a pack host. CI stays pack `roofus`. One Vercel project. Do not move roofus.coach onto grok.me.

Office mark + PWA name for a non-roofus tenant live in `localStorage` (`roofus-office-mark-v1`). Not Postgres. Pack `roofus` metal is frozen. `src/lib/db.ts` stays dark.

If a real backend is the job, that is **Prep to Launch** — a named child, not
quietly wiring these files. The phone book stays local-first after that too.
