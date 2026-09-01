# Admin Case Communications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar cinco ações administrativas de comunicação com prévia editável, confirmação explícita, anexos privados e histórico auditável.

**Architecture:** Regras puras de rascunho e anexos ficam em `lib/admin-case-communications.ts`. Uma Server Action dedicada recarrega o caso e os documentos canônicos, envia via Resend e persiste workflow/evento. Um diálogo cliente isolado controla as etapas editar e confirmar, mantendo a página como Server Component.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase SSR, Resend, Cloudflare R2, Zod, node:test.

## Global Constraints

- Usar Server Components por padrão e uma fronteira cliente mínima.
- Tratar Server Actions como endpoints públicos e reautorizar no servidor.
- Preservar `organization_id` e nunca expor chaves privadas do R2.
- Limitar anexos a 10 MB por arquivo e 35 MB por mensagem.
- Manter a interface em português.

---

### Task 1: Regras de comunicação e anexos

**Files:**
- Create: `lib/admin-case-communications.ts`
- Create: `lib/admin-case-communications.test.ts`
- Modify: `lib/admin-case-workflow.ts`

**Interfaces:**
- Produces: `buildAdminCaseCommunicationDraft`, `selectCommunicationAttachmentPreviews`, `validateCommunicationAttachmentSizes`.

- [ ] Escrever testes falhando para as cinco ações, rascunhos editáveis, seleção documental e limites.
- [ ] Executar `node --test --experimental-strip-types lib/admin-case-communications.test.ts` e confirmar falha por módulo ausente.
- [ ] Implementar as funções puras mínimas.
- [ ] Reexecutar o teste e confirmar sucesso.

### Task 2: Gateway de e-mail com anexos

**Files:**
- Modify: `lib/email/service.ts`
- Modify: `lib/email/templates.test.ts`

**Interfaces:**
- Consumes: anexos `{ filename, content, contentType }`.
- Produces: `sendCaseCommunicationEmail` com anexos privados opcionais.

- [ ] Escrever teste falhando para o conteúdo visível da comunicação documental.
- [ ] Executar a suíte de templates e confirmar a falha esperada.
- [ ] Encaminhar anexos ao Resend sem criar links públicos.
- [ ] Reexecutar a suíte e confirmar sucesso.

### Task 3: Server Action canônica

**Files:**
- Create: `app/actions/admin-case-communications.ts`

**Interfaces:**
- Consumes: IDs do caso, ação, destinatário, assunto, corpo e nota.
- Produces: `executeAdminCaseCommunication` e estado estruturado de formulário.

- [ ] Implementar carregamento canônico após `requirePanelAccess("admin")`.
- [ ] Montar anexos do R2 e snapshots RHF/SOA, aplicando limites antes do envio.
- [ ] Enviar mensagem com chave pública de validação.
- [ ] Atualizar workflow e registrar evento com metadados dos anexos.
- [ ] Revalidar lista e detalhe do caso.

### Task 4: Diálogo editar e confirmar

**Files:**
- Create: `app/admin/(protected)/cases/[organizationId]/[casePublicId]/_components/admin-case-communication-dialog.tsx`
- Modify: `app/admin/(protected)/cases/[organizationId]/[casePublicId]/_components/admin-case-action-menu.tsx`
- Modify: `app/admin/(protected)/cases/[organizationId]/[casePublicId]/page.tsx`

**Interfaces:**
- Consumes: contexto mínimo do caso, defaults e prévias de anexos.
- Produces: fluxo cliente `edit -> confirm -> success`.

- [ ] Habilitar somente as cinco ações de comunicação além do SRA existente.
- [ ] Criar formulário editável com erros de campo e lista de anexos.
- [ ] Criar confirmação somente leitura com checkbox obrigatório.
- [ ] Manter o diálogo aberto com erro e apresentar sucesso sem reenvio acidental.

### Task 5: Verificação final

**Files:**
- Verify all changed files.

- [ ] Executar testes unitários relevantes.
- [ ] Executar `node_modules\.bin\tsc.cmd --noEmit`.
- [ ] Executar ESLint nos arquivos alterados.
- [ ] Executar `git diff --check` e revisar o diff completo.
