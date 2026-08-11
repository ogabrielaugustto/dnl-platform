# Clicksign SRA Case Signature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a case SRA through Clicksign with database-prefilled variables, optional witnesses, and a focused admin action menu.

**Architecture:** Add pure SRA template/signing contracts beside the existing Clicksign helpers, generalize the Clicksign client for multiple signers, and orchestrate the case-specific mutation from the existing admin workflow action. Persist provider state in `case_documents` and map webhook updates back to the case settlement.

**Tech Stack:** Next.js 16 Server Actions, React 19, TypeScript, Zod, Supabase/Postgres, Clicksign API v3, node:test.

## Global Constraints

- DNL CNPJ comes only from `platform_settings.cnpj`.
- Notified party and DNL are mandatory signers; witness 1 and witness 2 are optional complete groups.
- All writes are scoped by `organization_id` and authorized as admin operations.
- Only the SRA action is enabled in the admin case dropdown until other actions are integrated.

---

### Task 1: SRA domain contract

**Files:**
- Modify: `lib/clicksign/representation-documents.ts`
- Modify: `lib/clicksign/representation-documents.test.ts`
- Modify: `lib/admin-case-workflow.ts`
- Modify: `lib/admin-case-workflow.test.ts`

**Interfaces:**
- Produces: `buildSraTemplateData`, `validateSraSignatureRequest`, `buildSraSigners`, and `isAdminCaseActionEnabled`.

- [ ] Write tests asserting every SRA placeholder, mandatory parties, optional complete witness groups, and action availability.
- [ ] Run `node --test --experimental-strip-types lib/clicksign/representation-documents.test.ts lib/admin-case-workflow.test.ts` and confirm the new assertions fail because the functions do not exist.
- [ ] Implement the minimal pure helpers with normalized CPF/CNPJ and Sao Paulo date formatting.
- [ ] Run the same command and confirm all helper tests pass.

### Task 2: Multi-signer Clicksign client

**Files:**
- Modify: `lib/clicksign/client.ts`

**Interfaces:**
- Consumes: SRA template data and signer list from Task 1.
- Produces: `createClicksignSraEnvelope`, returning envelope/document IDs plus one provider signer record per requested signer.

- [ ] Extract a private template-envelope workflow that creates qualification and e-mail authentication requirements for each signer.
- [ ] Keep `createClicksignSoaEnvelope` behavior compatible through the shared workflow.
- [ ] Add `createClicksignSraEnvelope` using `CLICKSIGN_SRA_TEMPLATE_KEY` and notify every signer after activation.

### Task 3: Case persistence and webhook synchronization

**Files:**
- Create: `lib/dal/admin-case-sra.ts`
- Create: `app/actions/admin-case-sra.ts`
- Modify: `app/api/clicksign/webhook/route.ts`

**Interfaces:**
- Produces: an admin-authorized SRA request path and webhook application by Clicksign envelope/document ID.

- [ ] Store provider IDs, signer records, template data, and webhook snapshots in the existing `case_documents.metadata` JSONB field.
- [ ] Load authoritative SOA, platform settings, case workflow, settlement, detections/assets, and notified defaults on the server.
- [ ] Validate the merged request, create the Clicksign envelope, archive the previous current SRA, and persist the new document and settlement state atomically where practical.
- [ ] Extend webhook handling to update matching case documents and set settlement status to `sra_signed` when signed.

### Task 4: Admin modal and action availability

**Files:**
- Modify: `app/(admin)/admin/cases/[organizationId]/[casePublicId]/page.tsx`
- Modify: `app/(admin)/admin/cases/[organizationId]/[casePublicId]/_components/admin-case-action-menu.tsx`
- Modify: `lib/dal/admin-cases.ts`

**Interfaces:**
- Consumes: serializable SRA defaults and server action field errors.

- [ ] Pass only the SRA defaults needed by the client component.
- [ ] Replace manual provider/file fields with template variables and signer e-mails, showing existing values and allowing missing values to be completed.
- [ ] Render non-integrated menu items disabled with an `Em breve` hint and keep `register_sra` selectable.
- [ ] Close and refresh after a successful request while preserving field errors on failure.

### Task 5: Verification

- [ ] Run the Clicksign and workflow helper tests.
- [ ] Run `node_modules\.bin\tsc.cmd --noEmit` and confirm exit code 0.
- [ ] Run `node_modules\.bin\eslint.cmd` and confirm no new errors or warnings attributable to this change.
- [ ] Search tracked changes for secrets and confirm no Clicksign token or webhook secret was introduced.
