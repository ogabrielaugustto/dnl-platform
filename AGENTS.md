<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project uses **Next.js 16** with **React 19** and **Supabase SSR**.
Before changing architecture, rendering strategy, routing, auth, cache, or request APIs, read the relevant local docs in `node_modules/next/dist/docs/`.

Mandatory references for this repo:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`

Important Next.js 16 reminders:

- `params`, `searchParams`, `cookies()`, and `headers()` are async.
- `proxy.ts` is the current request-boundary convention. Do not introduce root `middleware.ts`.
- Prefer App Router native files: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx`, `route.ts`.
- Use Server Components by default. Add `"use client"` only when interactivity or browser APIs are required.

# AGENTS.md — DNL Platform

## 1. What This Repo Is

This repository is the **main product application** for **DNL — Direito Na Lente**.

Everything customer-facing lives here:

- Landing page
- Authentication screens
- Client panel
- Admin panel
- Internal API routes and Server Actions

This repo is a **single Next.js app** today. It is **not** a monorepo yet.

Current real structure:

```txt
dnl-platform/
├── app/
├── components/
├── lib/
├── public/
├── AGENTS.md
├── next.config.ts
├── package.json
└── tsconfig.json
```

Do not pretend there is already an `apps/web` package here.
If a future migration to monorepo happens, update this file first.

## 2. Sister Repo Context

This repo works together with the sibling repository:

```txt
../dnl-worker
```

When a task touches product flow, database meaning, worker communication, job lifecycle, detections, or evidence generation, inspect:

- `c:/github/dnl-worker/AGENTS.md`
- `c:/github/dnl-worker/supabase/migrations/`

Right now, the most concrete database source of truth is in:

- `c:/github/dnl-worker/supabase/migrations/20260604170000_database_foundation.sql`
- `c:/github/dnl-worker/supabase/migrations/20260604173000_seed_subscription_plans.sql`

If this repo and the worker repo diverge, prefer the migration files over outdated assumptions.

## 3. Product Principle

This project is not just a CRUD.
The core value is the monitoring workflow:

```txt
Asset upload
→ monitoring rule / scan job
→ reverse image search
→ detection found
→ evidence captured
→ human validation
→ action / takedown / resolution
```

The UI must always reinforce that:

- A detection is not automatically an infringement.
- Human validation is mandatory.
- Evidence is operational support, not legal certainty.

Client/admin journey boundary:

- The client panel is not a self-running legal SaaS. The client uploads images, starts/uses monitoring, reviews found occurrences, and decides whether each occurrence is authorized, ignored, or an unauthorized use.
- When the client marks an occurrence as unauthorized, it becomes a case for DNL follow-up.
- The admin panel is where DNL employees continue the journey: reviewing the case, preparing legal/notification templates, deciding the operational path, and managing the manual legal follow-up.
- Do not design client screens as if the customer should handle the full legal process alone. Client UX should stop at upload, monitoring visibility, occurrence review, and case handoff to DNL.
- Do not design admin screens as generic SaaS administration only. Admin UX represents the DNL team's internal legal/operational workflow after the client validation step.

## 4. Architecture Decision

Use this rule when in doubt:

```txt
dnl-platform handles experience, auth, dashboards, CRUD, protected routes, and lightweight orchestration.
dnl-worker handles heavy processing, reverse search, screenshots, evidence generation, and background execution.
Supabase/Postgres stores state.
Cloudflare R2 stores files.
```

Never move heavy operational work into a user request just because it is easier to code in the moment.

## 5. Current Tech Stack

Frontend / fullstack:

- Next.js 16
- React 19
- TypeScript
- App Router
- Tailwind CSS v4
- shadcn/ui
- Supabase SSR

Auth / backend:

- Supabase Auth
- Supabase Postgres
- RLS and `organization_id`-scoped data

Worker side:

- Lives in `../dnl-worker`
- Fastify + Google Vision + Playwright today
- Supabase migrations already define the future shared domain model

## 6. Repo Responsibility

This repo must contain:

- LP and public pages
- Auth flows using Supabase
- Client dashboard
- Admin dashboard
- Protected route orchestration
- Upload UI and form handling
- Server Actions or Route Handlers for lightweight mutations
- Fetching and rendering tenant-safe data

This repo must not contain:

- Playwright browser automation
- Reverse image search execution
- Long-running screenshot processing
- Queue workers
- Heavy evidence generation
- Scheduler execution

## 7. Route Strategy

All panels and the landing page must live in this same Next app.

Use route groups to organize sections without changing URLs:

```txt
app/
├── (public)/
│   └── page.tsx                     → /
├── (auth)/
│   └── auth/
│       ├── login/page.tsx          → /auth/login
│       ├── register/page.tsx       → /auth/register
│       └── forgot-password/page.tsx→ /auth/forgot-password
├── (client)/
│   ├── dashboard/page.tsx          → /dashboard
│   ├── assets/
│   ├── detections/
│   ├── reports/
│   └── settings/
└── (admin)/
    └── admin/
        ├── page.tsx                → /admin
        ├── clients/
        ├── assets/
        ├── detections/
        ├── jobs/
        ├── reports/
        └── audit/
```

Rules:

- LP, auth, client, and admin stay in this repo.
- Do not create separate Next apps for client/admin in the MVP.
- Keep URLs clean; use route groups for organization, not URL decoration.
- Prefer nested layouts per area when the shell differs.

## 8. File Conventions We Must Use

For route segments, prefer native App Router structure:

- `page.tsx` for route entry
- `layout.tsx` for shared shell
- `loading.tsx` for streamed loading states
- `error.tsx` for route-scoped error boundaries
- `not-found.tsx` for 404 UI
- `global-error.tsx` for root failure state
- `route.ts` for HTTP endpoints

Rules:

- New significant route areas should usually include at least `page.tsx`, `loading.tsx`, and `error.tsx`.
- `error.tsx` must be a Client Component.
- Keep `loading.tsx` lightweight.
- Do not put important request-time auth logic only in `layout.tsx`, because layouts may not re-render on navigation.

## 9. Rendering Rules

Default mindset:

- Server-first
- Cache-friendly
- Streamed where helpful
- Minimal client JavaScript

Use Server Components for:

- Data fetching
- Supabase server reads
- Secure access to secrets
- Initial dashboard rendering
- Auth-aware page loading

Use Client Components only for:

- Form interactivity
- Local state
- Browser APIs
- Search/filter UI that depends on client state
- Hooks like `usePathname`, `useSearchParams`, `useRouter`

Avoid:

- Marking whole pages or layouts as client unnecessarily
- Pulling secure logic into the browser
- Reading sensitive data directly in client components

## 10. Fast Loading Rules

We want fast navigation and fast first paint.

Rules:

- Keep layouts as stable and lightweight as possible.
- Avoid uncached request-time work inside layouts unless wrapped carefully.
- Put request-bound data loading in pages or leaf server components when possible.
- Use `loading.tsx` at route boundaries that may suspend.
- Use `Suspense` for finer-grained slow areas.
- Fetch close to the component that needs the data.
- Let Next dedupe fetches instead of manually over-sharing data through layouts.

When a route is important and can be slow, create:

```txt
page.tsx
loading.tsx
error.tsx
```

## 11. Auth Rules With Supabase SSR

Current auth utilities already exist in:

- `lib/server.ts`
- `lib/client.ts`
- `lib/middleware.ts`
- `proxy.ts`

Auth conventions:

- Use Supabase SSR clients, not ad-hoc browser-only auth patterns.
- Server reads should use `lib/server.ts`.
- Client-only auth interactions should use `lib/client.ts`.
- Request-bound session refresh must go through `proxy.ts`.
- Keep secrets server-only.

Important Next.js auth rule from the docs:

- Do not rely only on layout-level auth checks.
- Protect data in the page, DAL, Server Action, or Route Handler that actually uses it.

## 12. Route Protection Rules

Public routes:

- `/`
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`

Protected client routes:

- `/dashboard`
- `/assets`
- `/detections`
- `/reports`
- `/settings`

Protected admin routes:

- `/admin`

Rules:

- Use `proxy.ts` for request-bound session refresh and coarse route gating.
- Use deeper server-side authorization checks in pages, actions, and route handlers.
- Never assume hiding a button in the UI is authorization.
- Admin access must be validated with server-side role checks.

## 13. Multi-Tenant Security

This project is multi-tenant from the beginning.

Mandatory rules:

- Every sensitive record is scoped by `organization_id`.
- Never return data from another organization in client routes.
- Respect RLS and tenant boundaries in every data path.
- Only expose fields needed by the current UI.
- Never trust client-submitted `organization_id` blindly.

When implementing queries or mutations, verify:

- who is the user
- what organization they belong to
- what role they have
- whether the data being fetched belongs to that organization

## 14. Domain Model Reference

The current database model already goes beyond the older MVP draft.
Important entities visible in migrations:

- `profiles`
- `organizations`
- `organization_members`
- `subscription_plans`
- `organization_subscriptions`
- `assets`
- `asset_files`
- `monitoring_rules`
- `scan_jobs`
- `scan_runs`
- `detections`
- `detection_evidences`
- `detection_actions`
- `audit_logs`

If creating frontend types or screen structure, align naming with the migrations.

Use English in code:

```txt
profiles
organizations
organizationMembers
assets
assetFiles
monitoringRules
scanJobs
scanRuns
detections
detectionEvidences
detectionActions
auditLogs
```

UI text may stay in Portuguese.

## 15. Recommended App Organization

Use a structure that fits the current repo, not a hypothetical future monorepo:

```txt
app/
├── (public)/
├── (auth)/
├── (client)/
├── (admin)/
├── api/
├── global-error.tsx
├── layout.tsx
├── not-found.tsx
└── globals.css

components/
├── ui/
└── ...

lib/
├── auth/
├── dal/
├── supabase/
├── validations/
└── ...
```

Notes:

- It is okay to colocate route-specific helpers inside route folders.
- Use `_components`, `_lib`, `_actions`, `_schemas` private folders inside route segments when the feature is local.
- Use `components/ui` for generic reusable UI only.
- Use `lib/` for cross-route utilities, auth helpers, DAL, and pure shared logic.

## 16. Data Access Pattern

Prefer a DAL-style approach for secure reads:

- Session verification in server code
- Tenant-safe query helpers
- DTO-like outputs with only the needed fields

Recommended direction:

```txt
lib/dal/
├── auth.ts
├── organizations.ts
├── assets.ts
├── detections.ts
└── admin.ts
```

Rules:

- Read data on the server.
- Return only the columns needed by the UI.
- Keep authorization close to the data read.
- Do not pass raw giant records to client components.

## 17. Forms and Mutations

Prefer native Next patterns:

- Server Actions for simple internal mutations
- `route.ts` for explicit HTTP endpoints or integration-style handlers
- Zod for server validation
- `useActionState` for expected form errors

Rules:

- Treat every Server Action like a public backend mutation.
- Validate input on the server.
- Authorize again on the server.
- Return expected errors as values when appropriate.
- Reserve thrown errors for truly unexpected failures.

## 18. Error Handling Rules

Expected errors:

- validation failures
- auth failures
- permission denials
- empty states
- business-rule rejections

These should be handled explicitly in pages, actions, and handlers.

Unexpected errors:

- coding bugs
- broken assumptions
- integration crashes
- unhandled runtime failures

These should be caught by route-level `error.tsx` or `global-error.tsx`.

Rules:

- Add route-level `error.tsx` for important sections.
- Use `unstable_retry()` in route error boundaries when helpful.
- Use `notFound()` and `not-found.tsx` for missing resources.
- Do not leak sensitive server error messages into the UI.

## 19. Next.js 16-Specific Rules

- Do not create root `middleware.ts`; use `proxy.ts`.
- Do not use removed `next lint`; run `eslint` directly.
- Do not assume sync `params` or sync `searchParams`.
- Do not manually write `<head>` metadata in layouts; use Metadata API.
- Prefer `images.remotePatterns` over deprecated `images.domains`.
- Be aware that layouts do not re-render on navigation.

When typing route props, prefer:

- `PageProps<'/route'>`
- `LayoutProps<'/route'>`

when type generation is available.

## 20. Code Style Rules

- Use TypeScript strict mode.
- Avoid `any`.
- Keep files small and focused.
- Prefer named functions for domain logic.
- Separate UI, validation, auth, and data concerns.
- Use Zod for input schemas.
- Use English for code identifiers.
- Keep UI copy in Portuguese unless there is a product reason not to.

Avoid:

- giant page files
- giant client components
- auth logic duplicated in many places
- heavy business logic inside JSX
- silent `catch`

## 21. UX Rules

The app should communicate state clearly.

Important product states:

```txt
Aguardando varredura
Processando
Ocorrências encontradas
Nenhuma ocorrência encontrada
Falha na varredura
Aguardando revisão
Possível infração
Resolvido
Ignorado
```

The user should understand:

- what is still processing
- what needs human review
- what is safe vs uncertain
- when evidence exists or failed to capture

## 22. Out of Scope Warnings

Do not introduce without explicit instruction:

- separate backend app for the platform
- separate admin app
- crawler infrastructure
- custom image-matching AI
- legal workflow automation beyond MVP
- Redis/BullMQ in this repo
- Playwright processing in this repo
- microservices

## 23. How Codex Must Work Here

Before coding:

1. Read this file.
2. Inspect the current route area and existing local conventions.
3. Check relevant Next.js 16 local docs if the task touches routing, auth, loading, error boundaries, cache, or request APIs.
4. If the task touches worker/database flow, inspect `../dnl-worker/AGENTS.md` and related migrations.

While coding:

1. Keep LP, auth, client, and admin in this repo.
2. Use App Router conventions.
3. Prefer Server Components.
4. Use `loading.tsx` and `error.tsx` intentionally.
5. Protect tenant data.
6. Keep heavy work out of user requests.

Before finishing:

1. Run typecheck if available.
2. Run lint if available.
3. Verify no secrets were introduced.
4. Verify route protection still makes sense.
5. Verify no cross-tenant leakage was introduced.

## 24. Final Quality Checklist

```txt
[ ] Code compiles.
[ ] Next.js 16 conventions were respected.
[ ] Async request APIs were handled correctly.
[ ] Server validation exists for mutations.
[ ] Route protection is not only in the UI.
[ ] `organization_id` boundaries are preserved.
[ ] No secrets leaked to the client.
[ ] No heavy processing was moved into Next requests.
[ ] `loading.tsx` / `error.tsx` were added where the route needs them.
[ ] Landing page, auth, client, and admin remain in this same app.
[ ] Changes stay aligned with dnl-worker and current migrations.
```

## 25. Guiding Sentence

When in doubt, follow this:

```txt
One Next.js app for LP + auth + client + admin.
Server-first rendering with Supabase SSR.
Protected multi-tenant data by organization.
Native Next.js file conventions for routing, loading, and errors.
Heavy processing belongs to dnl-worker, not to user requests.
```

<!-- END:nextjs-agent-rules -->
