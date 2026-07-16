# Platform General Settings Design

## Objective

Add a new `Geral` tab to `/admin/platform` so DNL admins can maintain institutional platform data used by future legal documents, templates, emails, and operational screens.

## Scope

The feature stores DNL-wide institutional information manually. It does not call BrasilAPI, ViaCEP, or other enrichment services in this iteration.

## Data Model

Extend the existing singleton table `public.platform_settings` in the shared schema owned by `dnl-worker`. Keep the current boolean singleton primary key (`id = true`) and add explicit nullable columns:

- `trade_name`
- `legal_name`
- `cnpj`
- `institutional_email`
- `institutional_phone`
- `postal_code`
- `address_line`
- `address_number`
- `address_complement`
- `district`
- `city`
- `state`
- `about`
- `legal_representative_name`
- `legal_representative_document`
- `legal_representative_role`
- `legal_representative_phone`
- `legal_representative_email`

The existing contact fields remain unchanged.

## Admin Experience

`/admin/platform` gains a `Geral` tab before `Planos`, `Usuarios`, and `Contato`. The page loads general settings together with the current plans, users, organizations, and contact settings.

The form is a quiet admin form using existing shadcn UI primitives. Fields are grouped by:

- Dados institucionais
- Endereco
- Representante legal

The form saves through a Server Action, shows toast feedback, records an admin activity, and revalidates `/admin/platform`.

## Validation

Validation runs server-side with Zod in `lib/dal/admin-platform-helpers.ts`.

- Blank optional values become `null`.
- CNPJ is optional, but when filled must contain 14 digits.
- CEP is optional, but when filled must contain 8 digits.
- UF is optional, but when filled must contain 2 letters and is stored uppercase.
- E-mails are optional, but when filled must be valid.
- Long free text is bounded to avoid accidental oversized content.

## Testing

Add focused tests around the new parser helper:

- Normalizes whitespace and empty strings.
- Stores CNPJ/CEP/document/phone as submitted text, while validating digit counts where required.
- Uppercases UF.
- Rejects invalid CNPJ, CEP, UF, and e-mail.

Run the focused helper test, TypeScript typecheck, and lint before completion.
