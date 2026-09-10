# Architecture Note

## Repository audit (Phase 0)

The working directory `C:\VS Code\Portfolio` was **completely empty**: no files, no
`package.json`, no source, no assets, no git repository, no deployment config.
There was therefore nothing to reuse and no existing framework to preserve.

Tooling found on the machine:

| Tool            | Status |
| --------------- | ------ |
| Node.js         | v20.17.0 |
| npm             | 11.6.1 |
| Docker          | installed (v29.6.1) but **daemon not running** |
| `gh` CLI        | not installed |
| `vercel` CLI    | not installed |
| `supabase` CLI  | not installed |
| `psql`          | not installed |
| npm registry    | reachable |

No cloud credentials (Vercel / Supabase / GitHub tokens) are present in the
environment or in `~/.config`. This constrains the deployment step; see
"Deployment strategy" below.

## Chosen stack

| Layer          | Choice | Reason |
| -------------- | ------ | ------ |
| Framework      | Next.js 16 (App Router) | Server Components + streaming + server actions give progressive loading and a small client bundle without extra libraries. |
| Language       | TypeScript (strict) | Type safety across DB -> service -> UI. |
| Styling        | Tailwind CSS v4 | Zero-runtime CSS, no CSS-in-JS bundle cost. v4 needs only `@tailwindcss/postcss`. |
| Database       | PostgreSQL | Relational content model, arrays, constraints. |
| DB driver      | `postgres` (prod) / `@electric-sql/pglite` (local) | PGlite is *real* Postgres compiled to WASM. Same SQL, same Drizzle schema, no server needed — so local dev and tests run with genuine Postgres semantics with zero setup. Setting `DATABASE_URL` switches to a normal Postgres server (Supabase/Neon/RDS). |
| ORM            | Drizzle ORM + drizzle-kit | Thin, typed SQL. No runtime query engine binary (unlike Prisma), so serverless cold starts stay small. |
| Validation     | Zod v4 | One schema reused for server actions, REST API and form errors. |
| Auth           | Custom: Node `crypto.scrypt` + opaque DB sessions | Single-admin CMS. Avoids a heavy auth framework. DB-backed sessions allow instant revocation; scrypt is in Node core so there is no native module to break on Windows. |
| Storage        | Pluggable driver: `local` filesystem or Supabase Storage | Binaries never go in Postgres. `media` table stores metadata + storage key only. |
| Deployment     | Vercel + Supabase (Postgres + Storage) | Target described in `README.md`. |

Every dependency is justified in `README.md` -> "Dependencies and why".

## Folder structure

```
src/
  app/
    (public routes)      layout, page, projects/[slug], sitemap, robots
    admin/               CMS dashboard (server-rendered, auth-gated)
    api/                 public GET endpoints
    api/admin/           authenticated mutation endpoints
    media/[id]/          streams/redirects stored files
  components/
    site/                public portfolio sections
    admin/               CMS tables, forms, dialogs
    ui/                  shared primitives (button, input, toast, ...)
  lib/
    db/                  schema, connection, migrate, seed
    auth/                password hashing, sessions, guards
    storage/             object-storage drivers
    services/            data-access layer (the ONLY place that touches the DB)
    validation/          zod schemas shared by actions + API
  types/
```

## Rendering & caching strategy

- Public pages are **Server Components**. The hero renders immediately; every other
  section is wrapped in `<Suspense>` with a skeleton so the page **streams**
  progressively instead of blocking on the full dataset.
- Read queries go through `cachedQuery()` (`src/lib/cache.ts`), which layers
  Next's data cache with **tags** per entity (`projects`, `skills`, ...).
- Any admin mutation calls `revalidateEntity()`, which invalidates only the tags
  it touched plus the affected route — never the whole site.
- Admin pages are `force-dynamic` and never cached.
- Client components are used only where interaction demands it (theme toggle,
  mobile nav, forms, drag-ordering).

## Security model

- Sessions are opaque 256-bit tokens; only a SHA-256 hash is stored.
- Cookies: `HttpOnly`, `SameSite=Lax`, `Secure` in production, `__Host-` prefixed
  in production.
- Every admin server action and every `/api/admin/*` route calls `requireAdmin()`
  server-side. Middleware is a UX redirect only, never the security boundary.
- Mutating requests verify the `Origin` header against the host (CSRF).
- Uploads are restricted by MIME type and size, and are stored with a generated
  key — the client-supplied filename is never used as a path.

## Deployment strategy

The app is deployment-ready for Vercel + Supabase and contains everything needed
(`vercel.json` is unnecessary; `README.md` documents the exact steps). Because no
Vercel/Supabase/GitHub credentials exist in this environment, the deploy step
itself cannot be executed here — see "Remaining work" in the final report.
