# Neel Khandelwal — Portfolio + CMS

A personal developer portfolio whose content lives entirely in PostgreSQL and is
managed through a private admin dashboard. Nothing on the public site is
hardcoded: projects, experience, skills, education, certifications,
achievements, the resume, social links and SEO metadata are all edited at
`/admin` and appear on the public site immediately, with no rebuild or redeploy.

---

## Contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Authentication](#authentication)
- [File storage](#file-storage)
- [Caching and revalidation](#caching-and-revalidation)
- [Using the admin dashboard](#using-the-admin-dashboard)
- [API](#api)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Dependencies and why](#dependencies-and-why)
- [Known limitations](#known-limitations)

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then edit ADMIN_PASSWORD and SESSION_SECRET
npm run db:migrate             # create the schema
npm run db:seed                # create the admin user + starter content
npm run dev
```

Open <http://localhost:3000> for the portfolio and
<http://localhost:3000/admin> for the dashboard.

No database server is required for local development. With `DATABASE_URL` left
empty the app runs on **PGlite** — real PostgreSQL compiled to WebAssembly,
persisted to `./.data/pgdata`. The schema, SQL and ORM code are identical to
production; only the driver differs.

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4 (zero runtime CSS-in-JS) |
| Database | PostgreSQL — `postgres` driver in production, PGlite locally |
| ORM | Drizzle ORM + drizzle-kit migrations |
| Validation | Zod v4, shared by server actions and the REST API |
| Auth | Custom: Node `scrypt` hashing + opaque database-backed sessions |
| Storage | Pluggable driver — local filesystem, Vercel Blob, or Supabase Storage |
| Analytics | Vercel Web Analytics (~1 KB, only active on Vercel) |

### Request flow

```
UI (Server Components)
  ↓
Server Actions  /  Route Handlers (/api/admin/*)
  ↓
Service layer (src/lib/services)   ← the only code that touches the database
  ↓
Drizzle ORM → PostgreSQL
```

Database access never happens inside a component. Every write goes through a
service, which also performs cache invalidation — so it cannot be forgotten.

### Folder structure

```
src/
├── app/
│   ├── page.tsx                 public homepage (streamed sections)
│   ├── projects/                listing + /projects/[slug]
│   ├── admin/                   CMS, route-grouped as (dashboard)
│   ├── api/                     public GET endpoints
│   ├── api/admin/               authenticated mutations
│   ├── media/[id]/              streams stored files
│   ├── sitemap.ts, robots.ts
├── components/
│   ├── site/                    public sections
│   ├── admin/                   CMS tables, forms, dialogs, toasts
│   └── ui/                      shared primitives + inline icon set
├── lib/
│   ├── db/                      schema, connection, migrate, seed
│   ├── auth/                    password, sessions, guards, CSRF
│   ├── services/                data-access layer
│   ├── storage/                 object-storage drivers + upload policy
│   ├── validation/              Zod schemas
│   ├── actions/                 server actions
│   └── cache.ts                 tags + revalidation
├── tests/                       unit tests (node:test)
└── types/
```

### Rendering strategy

The homepage awaits only the profile, so the header and hero render
immediately. Every section below sits behind its own `<Suspense>` boundary with
a matching skeleton, so the server **streams** each one as its query resolves
rather than holding the document until the slowest query finishes.

Client JavaScript is limited to what genuinely needs interactivity: the theme
toggle, the mobile navigation, and the forms. The rest is server-rendered.

---

## Environment variables

Copy `.env.example` to `.env.local`. Never commit a filled-in file.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | production | PostgreSQL connection string. Empty locally → embedded PGlite. |
| `SESSION_SECRET` | production | 32+ random bytes; used to hash session tokens. |
| `ADMIN_EMAIL` | seeding | Email of the first admin user. |
| `ADMIN_PASSWORD` | seeding | Password for that user (min 10 chars). Used only by `db:seed`. |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin for metadata, sitemap and canonical URLs. |
| `STORAGE_DRIVER` | production | `local` (default), `vercel-blob`, or `supabase`. **Never `local` on a serverless host.** |
| `BLOB_READ_WRITE_TOKEN` | if vercel-blob | Set automatically by Vercel once a Blob store is connected. |
| `SUPABASE_URL` | if supabase | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | if supabase | Service-role key. **Server only** — never exposed to the browser. |
| `SUPABASE_STORAGE_BUCKET` | no | Bucket name, default `portfolio-media`. |
| `NEXT_PUBLIC_STORAGE_ORIGIN` | if supabase | Storage origin, so `next/image` can allow-list it. |

Secrets are read only through `src/lib/env.ts`, which imports `server-only`, so
they cannot leak into a client bundle.

---

## Database

15 tables with primary keys, foreign keys, indexes, timestamps and constraints.

```
users, sessions                       auth
profile, site_settings                single-row settings
skill_categories, skills              skills, grouped
projects, project_screenshots         portfolio work
experiences                           internships and roles
education, certifications, achievements
social_links, media, contact_messages
```

Technology lists are stored as PostgreSQL `text[]` rather than join tables.
They are display-only labels that are always read with their parent row, so a
join table would add queries and complexity without buying anything.

```bash
npm run db:generate   # generate SQL migration from the schema
npm run db:migrate    # apply migrations
npm run db:seed       # idempotent: skips any table that already has rows
npm run db:studio     # Drizzle Studio (requires DATABASE_URL)
```

---

## Authentication

Real, server-verified authentication — not a frontend-only guard.

- Passwords are hashed with **scrypt** (Node core, memory-hard) using a random
  per-user salt, and compared in constant time. Plain text is never stored.
- Sessions are opaque 256-bit random tokens. Only a SHA-256 hash of the token is
  stored, so a leaked database yields no usable cookies. Logging out revokes
  access immediately.
- Cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production and prefixed
  `__Host-` in production.
- **Every** admin page calls `requireAdminPage()` before reading any data, and
  every server action and `/api/admin/*` handler calls `requireAdmin()`.
- `src/proxy.ts` only redirects visitors with no session cookie. It runs on the
  edge and cannot see the database, so it is a convenience, never the boundary.
- Mutating API requests additionally verify the `Origin` header (CSRF).
- Login is rate limited (8 attempts / 15 min per IP) and takes the same time
  whether or not the email exists, so accounts cannot be enumerated by timing.

---

## File storage

Binaries never go in the database; `media` stores metadata and a storage key.

- `STORAGE_DRIVER=local` → files in `./.data/uploads`, served through
  `/media/[id]`. **Development only** — a serverless filesystem is ephemeral,
  so uploads would vanish on the next cold start.
- `STORAGE_DRIVER=vercel-blob` → files in a Vercel Blob store, served from its
  CDN; `/media/[id]` redirects rather than proxying bytes. Use this on Vercel.
- `STORAGE_DRIVER=supabase` → files in a Supabase Storage bucket; `/media/[id]`
  redirects to the public URL.

Drivers return the key to persist from `put()`, because Vercel Blob mints its
own URL rather than using the key we generate.

Uploads are validated before any bytes are written: JPEG, PNG, WebP, AVIF, GIF
(5 MB) and PDF (10 MB). SVG is deliberately rejected because it can carry inline
script and these files are served from the site's own origin. The stored key is
a UUID plus an extension derived from the validated MIME type — the client's
filename is never used to build a path, so traversal is impossible by
construction. Files are served with `nosniff`, a restrictive CSP and `sandbox`.

---

## Caching and revalidation

Every public read is wrapped in `cachedQuery()` and tagged by content type.
When you save in the admin:

```
Save → validate → write to database → invalidate that entity's tag(s)
     → revalidate the affected routes → public site shows the change
```

Editing a skill does not evict the projects cache. Inside a Server Action the
code uses `updateTag`, which gives read-your-own-writes, so the page you land on
after saving already shows the new data.

---

## Using the admin dashboard

Sign in at `/admin/login` with the credentials from your `.env.local` seed.
**Change the password after first login** by re-seeding with a new
`ADMIN_PASSWORD` against an empty `users` table, or by updating the row directly.

| Task | Where |
| --- | --- |
| **Add a project** | Projects → *New project* → fill in name, slug, descriptions, technologies, links → tick *Published* (and *Featured* to show it on the homepage) → **Create project** |
| **Edit a project** | Projects → click the project (or *Edit*) → change fields → **Save changes** |
| **Delete a project** | Projects → *Delete* → confirm in the dialog |
| **Add an internship** | Experience → *Add experience* → company, role, type, dates, responsibilities (one per line), achievements, technologies, optional logo and certificate |
| **Edit an internship** | Experience → click it → **Save changes** |
| **Reorder anything** | Use the ▲▼ buttons on any list; the order is saved immediately and mirrors on the public site |
| **Update skills** | Skills → *Add skill* (or *New category* first). Skills group under their category; hide one with the *Visible* checkbox |
| **Update education** | Education → add or edit institution, degree, dates, CGPA, coursework |
| **Add certifications** | Certifications → name, issuer, dates, credential ID/URL, optional certificate PDF |
| **Update the resume** | Resume → *Upload resume* (PDF). The View/Download buttons appear on the site automatically; *Remove* hides them |
| **Change profile** | Profile → name, headline, bio, About text, interests, contact email, photo |
| **Change social links** | Social links → add/edit GitHub, LinkedIn, email (`mailto:…`); the icon follows the *Platform* field |
| **SEO / site settings** | Site settings → SEO title and description, social preview image, footer text, contact form and analytics toggles |
| **Read contact messages** | Messages |
| **Manage uploads** | Media — every uploaded file, with delete |

Content changes take effect on the public site immediately. You never need to
edit source code, restart the app, rebuild or redeploy.

---

## API

Public reads and admin mutations are separate route trees.

| Method | Route | Auth |
| --- | --- | --- |
| `GET` | `/api/projects` | public — published projects only |
| `GET` | `/api/portfolio` | public — the whole portfolio as JSON |
| `GET` | `/api/admin/projects` | admin — includes drafts |
| `POST` | `/api/admin/projects` | admin |
| `GET/PUT/DELETE` | `/api/admin/projects/:id` | admin |

Unauthenticated requests to any `/api/admin/*` route return `401` with
`{"error":"Unauthorized"}`.

The dashboard itself uses Server Actions rather than these endpoints; the REST
API exists for external integrations and scripting.

---

## Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # unit tests
npm run verify      # lint + typecheck + build
```

---

## Deployment

Target: **Vercel** (app) + **Neon** (PostgreSQL) + **Vercel Blob** (uploads).

Neon provides Postgres but no object storage, and Vercel's filesystem is
ephemeral — so a Blob store is required for the resume, project images and
certificates to survive.

1. **Database** — create a project at [neon.tech](https://neon.tech) and copy
   the *pooled* connection string (it contains `-pooler`). Keep `?sslmode=require`.

2. **Push the schema and seed the admin user**

   ```bash
   export DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   npm run db:migrate
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run db:seed
   ```

3. **Deploy** — import the GitHub repository on Vercel, then add these
   environment variables (Production + Preview):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon pooled connection string |
   | `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `NEXT_PUBLIC_SITE_URL` | your final domain, e.g. `https://neel.vercel.app` |
   | `STORAGE_DRIVER` | `vercel-blob` |

4. **Blob store** — in the Vercel dashboard: *Storage → Create → Blob*, connect
   it to the project. This injects `BLOB_READ_WRITE_TOKEN` automatically.
   Redeploy so the app picks it up.

5. **Verify** — load the site, sign in at `/admin`, upload the resume, create a
   test project, confirm both appear publicly, then delete the test project.

`SESSION_SECRET` must be set in production; the app refuses to start without it.
Set `NEXT_PUBLIC_SITE_URL` before relying on the sitemap or canonical URLs —
they are generated from it.

## Dependencies and why

Runtime dependencies are deliberately few.

| Package | Why |
| --- | --- |
| `next`, `react`, `react-dom` | The framework. |
| `drizzle-orm` | Typed SQL with no runtime query engine, so serverless cold starts stay small. |
| `postgres` | PostgreSQL driver used in production. |
| `@electric-sql/pglite` | Embedded PostgreSQL so local development and tests need no server. |
| `zod` | One validation schema shared by server actions and the REST API. |
| `@vercel/blob` | Object storage on Vercel, where the filesystem is ephemeral. Lazily imported, so it costs nothing when another driver is used. |
| `@vercel/analytics` | ~1 KB, deferred, cookie-free page analytics. |

Notably **not** used: an auth framework (scrypt + DB sessions is ~120 lines and
easier to audit), an icon library (the dozen icons used are inlined), a
component library, a drag-and-drop library (accessible ▲▼ buttons do the job),
`clsx`/`tailwind-merge` (a four-line helper suffices).

---

## Known limitations

- **Rate limiting is per process.** `src/lib/rate-limit.ts` holds counters in
  memory, which is correct for a single instance but not shared across
  serverless instances. Move it to Redis or Postgres before relying on it at
  scale.
- **`/projects/<unknown-slug>` responds `200` instead of `404`** while
  correctly rendering a "Project not found" page. Identical code at a different
  route path returns `404`, so this appears to be a Next 16 route-state quirk;
  `dynamic`, `revalidate`, metadata-level `notFound()` and a segment-level
  boundary were all tried without effect. Both the page metadata and
  `not-found.tsx` set `robots: noindex`, so these URLs are never indexed.
- **PGlite is single-process.** Two processes cannot open `./.data/pgdata` at
  once, so a production build snapshots the directory rather than competing with
  a running dev server. Killing `npm run dev` abruptly can corrupt the local
  database — delete `.data/pgdata` and re-run `db:migrate` + `db:seed`. This
  affects local development only; production uses a real PostgreSQL server.
- **Contact messages are stored, not emailed.** They appear under
  Messages in the dashboard. Wire up an email provider if you want
  notifications.
- **`drizzle-kit` pulls a dev-only advisory** (`esbuild` <=0.24.2 via
  `@esbuild-kit/core-utils`). It affects an esbuild dev server this project
  never runs, and `npm audit --omit=dev` reports zero vulnerabilities.
