# Platform Contact Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/platform` with Planos and Contato tabs, route public contact form emails through admin-configured platform contact settings, and show a WhatsApp option on `/contato`.

**Architecture:** Add a singleton `platform_settings` table in worker migrations, expose it through focused platform DAL/helpers/actions in `dnl-platform`, and reuse the existing admin plans table inside the new platform page. Keep public reads server-side and keep mutations admin-authorized.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase SSR/admin client, Resend, Zod 4, node:test, Tailwind/shadcn UI.

## Global Constraints

- Use `/admin/platform` and the label `Plataforma`.
- Do not keep `Organizacoes` as a visible admin sidebar entry.
- Keep client organization management in `/admin/clients`.
- Keep Resend as the outbound email provider.
- Heavy processing remains outside `dnl-platform`.
- Use Server Components by default and Client Components only for interactive forms/tabs.
- Add tests before production code for new helper behavior.

---

### Task 1: Platform Settings Schema And Helpers

**Files:**
- Create: `C:\github\dnl-worker\supabase\migrations\20260710130000_platform_contact_settings.sql`
- Create: `C:\github\dnl-platform\lib\dal\admin-platform-helpers.test.ts`
- Create: `C:\github\dnl-platform\lib\dal\admin-platform-helpers.ts`

**Interfaces:**
- Produces: `parseAdminPlatformContactForm(formData: FormData): ParsedAdminPlatformContactForm`
- Produces: `buildWhatsAppUrl(value: string | null): string | null`

- [ ] Write failing tests for valid form parsing, invalid email rejection, and WhatsApp URL formatting.
- [ ] Run `node --test --experimental-strip-types lib/dal/admin-platform-helpers.test.ts` and confirm it fails because the helper module does not exist.
- [ ] Add the helper module with Zod validation and WhatsApp normalization.
- [ ] Add the worker migration with singleton table, updated_at trigger, RLS, and admin-only policies.
- [ ] Re-run the targeted test and confirm it passes.

### Task 2: Platform DAL And Admin Action

**Files:**
- Create: `C:\github\dnl-platform\lib\dal\admin-platform.ts`
- Create: `C:\github\dnl-platform\app\actions\admin-platform.ts`

**Interfaces:**
- Consumes: `parseAdminPlatformContactForm`
- Produces: `getPlatformContactSettings()`
- Produces: `getPublicPlatformContactSettings()`
- Produces: `updateAdminPlatformContactAction(formData: FormData)`

- [ ] Add a failing test if a pure mapping helper is needed; otherwise rely on Task 1 helper coverage and implement DAL/action server code.
- [ ] Implement admin DAL reads through `requirePanelAccess("admin")` plus `createAdminClient()`.
- [ ] Implement public server-side settings read through `createAdminClient()` returning only contact fields.
- [ ] Implement admin update action with validation, singleton upsert, activity record, and revalidation for `/admin/platform` and `/contato`.

### Task 3: Admin Platform Route

**Files:**
- Create: `C:\github\dnl-platform\app\(admin)\admin\platform\page.tsx`
- Create: `C:\github\dnl-platform\app\(admin)\admin\platform\loading.tsx`
- Create: `C:\github\dnl-platform\app\(admin)\admin\platform\error.tsx`
- Create: `C:\github\dnl-platform\app\(admin)\admin\platform\_components\admin-platform-tabs.tsx`
- Create: `C:\github\dnl-platform\app\(admin)\admin\platform\_components\admin-platform-contact-form.tsx`
- Modify: `C:\github\dnl-platform\app\(admin)\layout.tsx`
- Modify: `C:\github\dnl-platform\app\(admin)\admin\organizations\page.tsx`

**Interfaces:**
- Consumes: `AdminPlansTable`, `AdminPlanListItem`, `AdminPlatformContactSettings`, `updateAdminPlatformContactAction`

- [ ] Build the server page loading plans and contact settings in parallel.
- [ ] Build client tabs with `Planos` and `Contato`.
- [ ] Build the contact settings form with fields for destination email and WhatsApp.
- [ ] Replace sidebar `Organizacoes` and `Planos` entries with one `Plataforma` entry.
- [ ] Redirect `/admin/organizations` to `/admin/platform`.

### Task 4: Public Contact Integration

**Files:**
- Modify: `C:\github\dnl-platform\app\(public)\contato\page.tsx`
- Modify: `C:\github\dnl-platform\app\actions\public.ts`
- Modify: `C:\github\dnl-platform\lib\email\service.ts`
- Modify: `C:\github\dnl-platform\components\marketing\contact-form.tsx`

**Interfaces:**
- Consumes: `getPublicPlatformContactSettings()`
- Consumes: `buildWhatsAppUrl()`
- Updates: `sendContactLeadEmail({ to, name, email, organization, message })`

- [ ] Update Resend contact email service to accept an explicit destination email and keep env fallback optional.
- [ ] Update the public contact action to load configured settings before sending.
- [ ] Update the public page to render an optional WhatsApp card.
- [ ] Keep safe success/error copy in Portuguese.

### Task 5: Verification

**Files:**
- No new files unless fixes are required.

- [ ] Run `node --test --experimental-strip-types lib/dal/admin-platform-helpers.test.ts`.
- [ ] Run `node_modules\.bin\tsc.cmd --noEmit`.
- [ ] Run `pnpm lint`.
- [ ] Run `git diff --check`.
- [ ] Review `git diff` for accidental secrets, wrong route labels, and cross-tenant leakage.

