# Clicksign SRA Case Signature Design

## Goal

Generate and send the case-specific SRA through Clicksign from the admin case action menu.

## Approved behavior

- The SRA belongs to a case and is persisted in `case_documents`, not in the organization-level SOA table.
- Existing database values prefill the Clicksign template. The modal displays every required value and leaves missing values for the admin to complete.
- The notified party and DNL representative are mandatory signers.
- Up to two witnesses may be included. Each witness is optional, but a provided witness must have complete name, CPF, and e-mail data.
- The SRA action creates the Clicksign envelope, document, signer requirements, notifications, case document, settlement state, and case history entry.
- Clicksign webhook events update both the SRA case document and the case settlement.
- Until other case actions have real integrations, only `register_sra` is enabled in the `Executar acao` dropdown.

## Data sources

- Photographer identity: current signed SOA snapshot for the organization.
- DNL CNPJ: `platform_settings.cnpj`.
- Case and image identifiers: current case and its unique assets.
- Notified party: case workflow/site investigation defaults, editable in the modal.
- Agreement amount and due date: current settlement, editable in the modal.
- Missing signer and template values: admin modal.

## Validation

The server action reauthorizes admin access, reloads the case data by `organization_id` and `case_public_id`, validates all mandatory template variables, validates complete optional witness groups, and never trusts hidden client context as the source of legal data.

## Verification

Pure helper tests cover exact template keys, missing-field detection, optional witnesses, and action availability. Integration changes must also pass TypeScript and ESLint.
