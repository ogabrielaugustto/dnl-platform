# Platform Contact Settings Design

## Goal

Replace the admin Organizations entry with a Platform administration area that owns global platform settings, starting with plan management and public contact routing.

## Naming And Route

Use "Plataforma" as the admin label and `/admin/platform` as the route. "Plataforma" is more product-oriented than "Sistema" and matches the page's purpose: internal administration of global product settings.

The old `/admin/organizations` route should stop being a visible admin destination. To avoid breaking stale links, it can redirect to `/admin/platform`.

## Admin Page

`/admin/platform` is an admin-only Server Component page. It loads:

- subscription plans with the existing `listAdminPlans()`.
- global contact settings from a new DAL.

The page uses tabs:

- `Planos`: reuses the current admin plan table and edit dialog.
- `Contato`: lets admins configure the public contact recipient email and optional WhatsApp.

## Data Model

Create a new shared Supabase table in the worker migrations:

```sql
public.platform_settings (
  id boolean primary key default true check (id),
  contact_email text,
  contact_whatsapp text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
)
```

The singleton boolean primary key keeps the table simple and prevents multiple competing platform configuration rows.

RLS:

- authenticated admin users can select/manage settings through `public.is_admin_user()`.
- public users do not read this table directly.
- the public contact page reads via the server-side platform code.

## Public Contact Flow

The public `/contato` page loads the current contact settings server-side.

- If `contact_whatsapp` exists, show a WhatsApp card with a direct external link.
- The contact form continues using a Server Action.
- The action validates the lead fields, loads the configured contact email, and sends the lead through Resend.
- If no platform email is configured, return a safe error: the visitor should try again later.
- The Resend `replyTo` remains the lead's email.

`CONTACT_INBOX_EMAIL` can remain as a development fallback for environments that have not migrated settings yet, but database settings are the product source of truth.

## Validation

Add helper tests for:

- parsing contact settings forms.
- formatting WhatsApp links from Brazilian and already-international numbers.
- rejecting invalid contact emails.

Run:

- targeted node tests for new helpers.
- `node_modules\.bin\tsc.cmd --noEmit`.
- `pnpm lint`.

