# Platform General Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual `Geral` tab in `/admin/platform` backed by durable singleton platform settings columns.

**Architecture:** Extend the existing `public.platform_settings` singleton instead of creating a second platform profile table. Keep parsing and validation in testable helper functions, server reads in the DAL, writes in a Server Action, and the form in a focused client component.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Zod, shadcn/ui, Node test runner.

## Global Constraints

- Work inside the existing `dnl-platform` Next.js app for UI, DAL, and Server Actions.
- Store shared schema changes as Supabase migrations in `dnl-worker`.
- Do not introduce external CNPJ or CEP lookups in this iteration.
- Preserve admin-only access through `requirePanelAccess("admin")` and existing RLS policies.
- Keep unrelated dirty worktree changes untouched.

---

### Task 1: General Settings Parser And Types

**Files:**
- Modify: `lib/dal/admin-platform-helpers.ts`
- Modify: `lib/dal/admin-platform-helpers.test.ts`

**Interfaces:**
- Produces: `parseAdminPlatformGeneralForm(formData: FormData): ParsedAdminPlatformGeneralForm`
- Produces: `AdminPlatformGeneralUpdateValues`

- [ ] **Step 1: Write failing parser tests**

Add tests that call `parseAdminPlatformGeneralForm()` with valid data and invalid CNPJ, CEP, UF, and e-mail values.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test --experimental-strip-types lib/dal/admin-platform-helpers.test.ts`

Expected: fail because `parseAdminPlatformGeneralForm` is not exported yet.

- [ ] **Step 3: Implement parser and validation**

Add Zod schema, normalize blank strings to `null`, uppercase `state`, and return database column names.

- [ ] **Step 4: Run the focused test and confirm pass**

Run: `node --test --experimental-strip-types lib/dal/admin-platform-helpers.test.ts`

Expected: all helper tests pass.

### Task 2: Database Migration

**Files:**
- Create: `../dnl-worker/supabase/migrations/20260716130000_platform_general_settings.sql`

**Interfaces:**
- Produces nullable columns on `public.platform_settings` consumed by the platform DAL.

- [ ] **Step 1: Add migration**

Create an idempotent migration with `alter table public.platform_settings add column if not exists ...` for all general fields.

- [ ] **Step 2: Inspect migration**

Run: `Get-Content -LiteralPath '..\dnl-worker\supabase\migrations\20260716130000_platform_general_settings.sql'`

Expected: migration only alters `public.platform_settings` and does not change RLS.

### Task 3: DAL And Server Action

**Files:**
- Modify: `lib/dal/admin-platform.ts`
- Modify: `app/actions/admin-platform.ts`

**Interfaces:**
- Produces: `getPlatformGeneralSettings(): Promise<AdminPlatformGeneralSettings>`
- Produces: `updateAdminPlatformGeneralAction(formData: FormData): Promise<AdminPlatformGeneralActionState>`

- [ ] **Step 1: Extend DAL read**

Select the new general fields from `platform_settings` and map snake_case row fields to camelCase DTO fields.

- [ ] **Step 2: Add update action**

Require admin access, parse form data, upsert `id: true`, record `platform_general_settings_updated`, and revalidate `/admin/platform` plus `/admin/activities`.

- [ ] **Step 3: Run typecheck after action/DAL changes**

Run: `node_modules\.bin\tsc.cmd --noEmit`

Expected: no TypeScript errors from the new DAL/action contracts.

### Task 4: Admin Geral Tab UI

**Files:**
- Modify: `app/(admin)/admin/platform/page.tsx`
- Modify: `app/(admin)/admin/platform/_components/admin-platform-tabs.tsx`
- Create: `app/(admin)/admin/platform/_components/admin-platform-general-form.tsx`

**Interfaces:**
- Consumes: `AdminPlatformGeneralSettings`
- Consumes: `updateAdminPlatformGeneralAction`

- [ ] **Step 1: Load general settings on the platform page**

Fetch `getPlatformGeneralSettings()` in parallel and pass it into `AdminPlatformTabs`.

- [ ] **Step 2: Add `Geral` tab trigger and content**

Make `general` the default tab and accept `?tab=general`.

- [ ] **Step 3: Build the form**

Use controlled state for the inputs, existing `Input`, `Textarea`, `Label`, `Button`, `Badge`, and `Card` components, and submit through the Server Action.

- [ ] **Step 4: Run typecheck**

Run: `node_modules\.bin\tsc.cmd --noEmit`

Expected: no TypeScript errors.

### Task 5: Verification

**Files:**
- No new files.

**Interfaces:**
- Verifies the complete feature.

- [ ] **Step 1: Run focused tests**

Run: `node --test --experimental-strip-types lib/dal/admin-platform-helpers.test.ts`

Expected: all helper tests pass.

- [ ] **Step 2: Run typecheck**

Run: `node_modules\.bin\tsc.cmd --noEmit`

Expected: no TypeScript errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: no new lint errors from the changed files. Existing warnings, if any, must be reported separately.
