<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# AGENTS.md — Contexto Técnico do Projeto DNL

## 1. Visão Geral

O projeto **DNL — Direito Na Lente** é uma plataforma SaaS para monitoramento e identificação de possíveis usos indevidos de imagens na internet.

A proposta é permitir que fotógrafos, agências, criadores, empresas ou titulares de direitos autorais cadastrem suas imagens na plataforma e recebam ocorrências encontradas na web por meio de busca reversa e análise automatizada.

O MVP tem foco em:

- Cadastro e organização de imagens monitoradas.
- Busca reversa usando Google Cloud Vision Web Detection.
- Registro de URLs onde imagens semelhantes ou correspondentes foram encontradas.
- Geração de evidências iniciais, incluindo screenshot e relatório.
- Validação humana das ocorrências.
- Gestão de status das detecções.
- Base técnica escalável para evoluir para uma plataforma SaaS completa.

Este projeto não deve ser tratado como apenas um CRUD. O núcleo de valor está no fluxo:

```txt
Imagem cadastrada → Busca reversa → Ocorrência encontrada → Evidência gerada → Validação humana → Ação/Notificação
```

---

## 2. Objetivo do MVP

O objetivo do MVP é validar tecnicamente e comercialmente se é possível entregar uma experiência funcional para:

1. Usuário cadastrar imagens próprias.
2. Sistema executar busca reversa dessas imagens.
3. Sistema registrar possíveis usos encontrados na internet.
4. Usuário/admin revisar as ocorrências.
5. Plataforma gerar evidências iniciais para tomada de ação.

O MVP deve ser simples, funcional e organizado, mas sem complexidade prematura.

Não construir microserviços desnecessários.
Não criar crawler próprio no MVP.
Não criar IA própria de matching no MVP.
Não automatizar toda a parte jurídica no MVP.
Não transformar o projeto em uma arquitetura grande antes de validar o core.

---

## 3. Arquitetura Recomendada

A arquitetura principal do projeto deve seguir este desenho:

```txt
Usuário/Admin
   ↓
Next.js App
   ↓
Supabase Auth + PostgreSQL
   ↓
Cloudflare R2
   ↓
Fila/Jobs
   ↓
Worker Node.js
   ↓
Google Cloud Vision + Playwright
   ↓
Banco + Storage + Logs + Evidências
```

Componentes principais:

```txt
apps/web      → Aplicação Next.js fullstack
apps/worker   → Worker Node.js para jobs pesados
packages/db   → Schema, migrations, queries e client do banco
packages/shared → Types, constantes, validadores e helpers compartilhados
```

A separação recomendada é:

```txt
Next.js:
- Interface
- Auth
- CRUD
- Upload
- Dashboard
- Filtros
- Permissões
- API interna
- Criação de jobs

Worker:
- Busca reversa no Google Vision
- Captura de screenshots
- Processamento em lote
- Retry de falhas
- Deduplicação de ocorrências
- Atualização de status dos jobs
- Geração de evidências pesadas
```

---

## 4. Estrutura de Repositório Recomendada

Preferir monorepo com `pnpm workspaces` e, se útil, `Turborepo`.

```txt
dnl/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/
│   │   │   │   ├── (client)/
│   │   │   │   ├── (admin)/
│   │   │   │   └── api/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── lib/
│   │   │   └── middleware.ts
│   │   └── package.json
│   │
│   └── worker/
│       ├── src/
│       │   ├── jobs/
│       │   ├── services/
│       │   ├── scheduler/
│       │   ├── queue/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── db/
│   │   ├── schema/
│   │   ├── migrations/
│   │   ├── queries/
│   │   └── client.ts
│   │
│   ├── shared/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── validators/
│   │   └── utils/
│   │
│   └── config/
│       ├── eslint/
│       ├── tsconfig/
│       └── prettier/
│
├── infra/
│   ├── docker-compose.yml
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── jobs.md
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── AGENTS.md
```

Se o projeto for dividido em repositórios separados, usar:

```txt
dnl-web      → Next.js
dnl-worker   → Worker Node.js
dnl-shared   → Opcional; evitar no começo se gerar fricção
```

A preferência é monorepo, pois reduz duplicação de types, validações, schema e regras de negócio.

---

## 5. Stack Técnica Padrão

### Frontend / Fullstack

Usar:

- Next.js 15+
- TypeScript
- App Router
- TailwindCSS
- shadcn/ui
- React Hook Form
- Zod

Evitar:

- Estado global desnecessário.
- Duplicação de telas entre cliente e admin.
- Componentes grandes demais.
- Lógica de negócio crítica dentro de componentes React.

### Banco e Auth

Usar:

- Supabase Auth
- Supabase PostgreSQL
- Drizzle ORM ou Prisma

Preferência técnica:

```txt
Drizzle ORM para schema tipado, SQL explícito e menor camada de abstração.
```

Se Prisma já estiver instalado ou acelerar muito o desenvolvimento, pode usar Prisma. A prioridade é consistência, não preferência estética.

### Storage

Usar:

- Cloudflare R2

Armazenar:

- Imagens originais.
- Thumbnails.
- Screenshots.
- Relatórios PDF.
- Snapshots ou arquivos auxiliares de evidência.

### Worker

Usar:

- Node.js
- TypeScript
- Playwright
- Google Cloud Vision SDK
- Sharp, quando necessário para tratamento de imagem
- Postgres queue no MVP ou BullMQ com Redis se a escala exigir

### Deploy

Usar:

- Vercel para `apps/web`.
- Railway para `apps/worker`.
- Supabase para banco e autenticação.
- Cloudflare R2 para arquivos.
- cron-job.org ou scheduler equivalente para disparar rotinas no MVP.

---

## 6. Separação de Responsabilidades

### `apps/web`

Responsável por:

- Landing page.
- Login, cadastro e recuperação de senha.
- Painel do cliente.
- Painel administrativo.
- Upload de imagens.
- Gestão de assets/obras.
- Listagem de detecções.
- Filtros por status, período, cliente, obra, domínio etc.
- Detalhe da ocorrência.
- Comparação visual entre imagem original e imagem encontrada.
- Ações manuais de classificação.
- Geração ou solicitação de relatório.
- Criação de jobs para processamento assíncrono.

Não deve:

- Rodar Playwright.
- Fazer processamento pesado.
- Executar varredura em massa.
- Chamar Google Vision em lote dentro de request HTTP do usuário.
- Fazer tarefas longas que possam estourar timeout.

### `apps/worker`

Responsável por:

- Buscar jobs pendentes.
- Executar busca reversa via Google Cloud Vision.
- Processar resposta da API.
- Deduplicar ocorrências.
- Capturar screenshots com Playwright.
- Salvar evidências no Cloudflare R2.
- Atualizar status dos jobs.
- Registrar erros e logs.
- Aplicar retry com limite de tentativas.
- Rodar varreduras agendadas.

Não deve:

- Renderizar UI.
- Conter regras de permissão de tela.
- Expor endpoints públicos sem proteção.
- Misturar lógica visual com lógica operacional.

### `packages/db`

Responsável por:

- Schema do banco.
- Migrations.
- Queries reutilizáveis.
- Tipos derivados do schema.
- Client de conexão.
- Helpers transacionais.

### `packages/shared`

Responsável por:

- Types compartilhados.
- Enums.
- Constantes.
- Validadores Zod.
- Helpers puros.
- Regras comuns entre web e worker.

Não deve conter:

- Dependência de React.
- Dependência de Next.js.
- Dependência direta de Playwright.
- Código específico de ambiente.

---

## 7. Rotas e Áreas da Aplicação

### Área pública

```txt
/
 /login
 /register
 /forgot-password
```

### Área do cliente

```txt
/dashboard
/assets
/assets/new
/assets/[id]
/detections
/detections/[id]
/reports
/settings
```

### Área administrativa

```txt
/admin
/admin/clients
/admin/assets
/admin/detections
/admin/jobs
/admin/reports
/admin/audit
```

A aplicação deve usar um único app Next.js com separação por rotas e permissões.

Não criar `dnl-client` e `dnl-admin` separados no MVP, salvo se houver decisão explícita posterior.

---

## 8. Modelo de Permissões

Perfis iniciais:

```txt
client_owner
client_member
admin
super_admin
```

Regras gerais:

- `client_owner`: gerencia a própria organização.
- `client_member`: acessa dados da organização, com permissões limitadas.
- `admin`: opera ocorrências, clientes e suporte.
- `super_admin`: acesso total operacional.

Todo dado sensível deve estar sempre vinculado a uma `organization_id`.

Nunca retornar dados de outra organização em endpoints do cliente.

---

## 9. Entidades Principais do Banco

### `organizations`

Representa o cliente/empresa/titular.

Campos sugeridos:

```txt
id
name
document
email
created_at
updated_at
```

### `organization_members`

Relaciona usuários a organizações.

```txt
id
organization_id
user_id
role
created_at
updated_at
```

### `assets`

Imagem/obra monitorada.

```txt
id
organization_id
title
description
author
sku
license_type
status
created_at
updated_at
```

### `asset_files`

Arquivo da imagem.

```txt
id
asset_id
r2_key
public_url
hash
phash
width
height
mime_type
size
created_at
```

### `scan_jobs`

Fila simples de processamento no MVP.

```txt
id
asset_id
organization_id
type
status
priority
scheduled_at
started_at
finished_at
attempts
error_message
created_at
updated_at
```

Tipos:

```txt
manual_scan
scheduled_scan
retry_scan
```

Status:

```txt
pending
processing
completed
failed
cancelled
```

### `detections`

Ocorrência encontrada.

```txt
id
asset_id
organization_id
source_url
matched_image_url
page_title
domain
confidence_score
vision_payload
status
first_seen_at
last_seen_at
created_at
updated_at
```

Status:

```txt
pending
possible_infringement
authorized
unauthorized
takedown_sent
resolved
ignored
```

### `detection_evidences`

Evidências da ocorrência.

```txt
id
detection_id
screenshot_r2_key
pdf_r2_key
html_snapshot_r2_key
captured_at
capture_status
metadata
created_at
updated_at
```

### `detection_actions`

Histórico de ações.

```txt
id
detection_id
user_id
action
from_status
to_status
notes
created_at
```

### `infringers`

Dados do possível infrator.

```txt
id
detection_id
company_name
legal_name
document
email
phone
address
domain
ownership_data
created_at
updated_at
```

### `audit_logs`

Auditoria geral.

```txt
id
organization_id
user_id
entity
entity_id
action
metadata
created_at
```

---

## 10. Fluxo de Upload

Fluxo esperado:

```txt
1. Usuário envia imagem pelo painel.
2. Web valida tamanho, formato e permissões.
3. Arquivo é salvo no Cloudflare R2.
4. Registro é criado em `assets`.
5. Registro técnico é criado em `asset_files`.
6. Job inicial é criado em `scan_jobs`.
7. Worker processa o job de forma assíncrona.
```

Regras:

- Não bloquear o usuário esperando Google Vision.
- Após upload, mostrar status como "Aguardando varredura" ou "Processando".
- Permitir reprocessamento manual.
- Manter histórico de tentativas.

---

## 11. Fluxo de Busca Reversa

Fluxo esperado:

```txt
1. Worker busca job com status `pending`.
2. Marca job como `processing`.
3. Carrega a imagem original do R2.
4. Envia imagem para Google Cloud Vision Web Detection.
5. Recebe URLs, imagens correspondentes e imagens similares.
6. Normaliza os resultados.
7. Deduplica por asset + URL + imagem encontrada.
8. Cria ou atualiza registros em `detections`.
9. Agenda captura de screenshot quando aplicável.
10. Marca job como `completed` ou `failed`.
```

Regras:

- Salvar payload bruto relevante da API em `vision_payload`.
- Não criar detecção duplicada para a mesma URL/imagem.
- Registrar erro detalhado em caso de falha.
- Limitar tentativas para evitar loop infinito.
- Não considerar automaticamente toda correspondência como infração. A validação humana é obrigatória.

---

## 12. Fluxo de Screenshot e Evidência

Fluxo esperado:

```txt
1. Worker recebe ou cria job de screenshot.
2. Abre a URL com Playwright.
3. Aguarda carregamento suficiente da página.
4. Captura screenshot.
5. Salva screenshot no Cloudflare R2.
6. Cria registro em `detection_evidences`.
7. Atualiza status da ocorrência.
```

Regras:

- Sites podem bloquear automação.
- Falha de screenshot não deve apagar a detecção.
- Registrar motivo da falha.
- Permitir nova tentativa manual.
- Não depender de screenshot para a detecção existir.

---

## 13. Fluxo de Validação Humana

A ocorrência encontrada deve ser revisada por humano.

A tela de detalhe deve mostrar:

- Imagem original.
- Imagem encontrada, quando disponível.
- URL de origem.
- Domínio.
- Data da detecção.
- Screenshot.
- Score de confiança.
- Payload resumido da API.
- Histórico de ações.
- Status atual.

Ações possíveis:

```txt
Marcar como possível infração
Marcar como autorizado
Marcar como não autorizado
Enviar/registrar takedown
Marcar como resolvido
Ignorar
```

Toda ação deve gerar registro em `detection_actions`.

---

## 14. Fluxo de Notificação/Takedown no MVP

No MVP, a notificação deve ser inicialmente semi-manual.

Pode existir:

- Geração de texto padrão.
- Prévia da notificação.
- Campo de valor de compensação.
- Registro de envio manual.
- Atualização de status.

Evitar no MVP:

- Disparo jurídico automatizado sem revisão.
- Cobrança automática.
- Integração com escritório jurídico.
- Workflow legal complexo.

---

## 15. Relatórios PDF

O relatório de evidência deve conter:

- Dados da imagem original.
- Dados da ocorrência.
- URL encontrada.
- Data/hora da coleta.
- Screenshot, quando disponível.
- Status da ocorrência.
- Identificador interno.
- Observações.

O PDF pode ser gerado:

- Pela aplicação web, se simples.
- Pelo worker, se envolver imagens pesadas, screenshot, template ou processamento mais demorado.

Preferência:

```txt
Gerar PDF via worker se houver risco de timeout.
```

---

## 16. Estratégia de Fila

No MVP, a fila pode ser uma tabela no PostgreSQL.

Tabela principal:

```txt
scan_jobs
```

Processamento:

```txt
1. Worker consulta próximo job `pending`.
2. Aplica lock/transação para evitar processamento duplicado.
3. Atualiza para `processing`.
4. Executa job.
5. Atualiza para `completed` ou `failed`.
6. Em caso de falha, incrementa `attempts`.
7. Se `attempts < max_attempts`, reagenda.
```

Migrar para BullMQ + Redis quando houver:

- Muitos jobs simultâneos.
- Vários workers paralelos.
- Necessidade de prioridades avançadas.
- Delays e retries mais sofisticados.
- Necessidade de dashboard específico de fila.

---

## 17. Agendamento de Varreduras

No MVP, usar scheduler externo ou cron simples.

Fluxo:

```txt
cron-job.org ou scheduler
   ↓
endpoint interno protegido
   ↓
criação de scan_jobs pendentes
   ↓
worker processa
```

Regras:

- O endpoint de scheduler deve ser protegido por secret.
- O scheduler não deve processar imagens diretamente.
- O scheduler apenas cria jobs.
- O worker processa.

Frequências possíveis:

```txt
weekly
daily
manual
```

A frequência deve ser configurável por plano, cliente ou asset no futuro.

---

## 18. Google Cloud Vision

Usar a funcionalidade:

```txt
Web Detection
```

Objetivo:

- Encontrar páginas com imagens correspondentes.
- Encontrar imagens visualmente similares.
- Retornar URLs públicas relacionadas.

Regras:

- Não assumir 100% de precisão.
- Sempre exigir validação humana.
- Salvar score/confiança quando disponível.
- Salvar URLs retornadas.
- Salvar payload bruto útil.
- Tratar falhas, limites e custos da API.

---

## 19. Segurança e Privacidade

Regras obrigatórias:

- Não expor imagens privadas sem controle.
- Não retornar dados entre organizações.
- Proteger endpoints internos.
- Usar variáveis de ambiente para secrets.
- Nunca commitar `.env`.
- Não logar tokens, chaves ou credenciais.
- Validar upload de arquivos.
- Limitar tipos aceitos de imagem.
- Limitar tamanho máximo de upload.
- Usar URLs assinadas quando necessário.
- Registrar auditoria para ações críticas.

---

## 20. Padrões de Código

### Geral

- Usar TypeScript estrito sempre que possível.
- Evitar `any`.
- Preferir funções pequenas e nomeadas.
- Separar lógica de negócio de UI.
- Evitar duplicação.
- Criar validações com Zod.
- Criar types compartilhados quando usados por web e worker.
- Tratar erros explicitamente.
- Não esconder erro crítico com `catch` vazio.

### Nomes

Usar inglês no código:

```txt
assets
detections
scanJobs
evidences
organizations
infringers
```

UI pode ser em português.

### Commits

Usar commits objetivos:

```txt
feat: add asset upload flow
feat: add scan job processing
fix: prevent duplicated detections
refactor: move detection types to shared package
```

---

## 21. Padrões para Next.js

Preferir:

- Server Components quando possível.
- Server Actions ou API Routes para mutações, conforme padrão adotado no projeto.
- Validação no servidor.
- Middleware para proteção de rotas.
- Componentes isolados por feature.
- `loading.tsx`, `error.tsx` e `not-found.tsx` quando fizer sentido.

Evitar:

- Buscar dados sensíveis direto no client.
- Duplicar fetch em vários componentes.
- Colocar regra de permissão apenas no frontend.
- Componentes de tela gigantes.
- Misturar upload, validação, banco e UI em um único arquivo.

Estrutura por feature:

```txt
features/
├── assets/
│   ├── components/
│   ├── actions/
│   ├── queries/
│   ├── schemas/
│   └── types.ts
│
├── detections/
│   ├── components/
│   ├── actions/
│   ├── queries/
│   ├── schemas/
│   └── types.ts
```

---

## 22. Padrões para Worker

O worker deve ser previsível, resiliente e fácil de debugar.

Estrutura sugerida:

```txt
apps/worker/src/
├── jobs/
│   ├── scan-asset.job.ts
│   ├── capture-screenshot.job.ts
│   └── generate-report.job.ts
│
├── services/
│   ├── vision.service.ts
│   ├── screenshot.service.ts
│   ├── storage.service.ts
│   ├── detection.service.ts
│   └── job.service.ts
│
├── queue/
│   └── postgres-queue.ts
│
├── scheduler/
│   └── create-scan-jobs.ts
│
└── index.ts
```

Regras:

- Cada job deve ter função clara.
- Todo job deve registrar início, fim e erro.
- Todo job deve ser idempotente quando possível.
- Não processar o mesmo job duas vezes.
- Não criar duplicatas de detecção.
- Aplicar timeout em chamadas externas.
- Aplicar retry limitado.
- Registrar falhas com contexto suficiente.

---

## 23. Variáveis de Ambiente

Exemplo geral:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=

GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_CLOUD_VISION_API_KEY=

INTERNAL_API_SECRET=
WORKER_CONCURRENCY=
MAX_JOB_ATTEMPTS=
```

Regras:

- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta no client.
- Chaves de R2 nunca devem ir para o frontend.
- Endpoints internos devem exigir `INTERNAL_API_SECRET`.
- Usar `.env.example` sem valores reais.

---

## 24. Observabilidade e Logs

Registrar logs para:

- Upload criado.
- Job criado.
- Job iniciado.
- Job concluído.
- Job falhou.
- Detecção criada.
- Detecção duplicada ignorada.
- Screenshot capturado.
- Screenshot falhou.
- Status alterado.
- Relatório gerado.

Logs devem conter:

```txt
job_id
asset_id
organization_id
detection_id
status
error_message
duration_ms
```

Não logar:

- Tokens.
- Secrets.
- Cookies.
- Chaves privadas.
- Payloads enormes sem necessidade.

---

## 25. Fora do Escopo do MVP

Não implementar no MVP, salvo ordem explícita:

- Crawler próprio para varrer a internet.
- IA própria de reconhecimento visual.
- Sistema jurídico automatizado completo.
- Cobrança automática de infratores.
- Integração com escritórios jurídicos.
- Marketplace de advogados.
- Multi-tenant complexo com billing avançado.
- App mobile.
- Microserviços.
- Kubernetes.
- Event sourcing.
- Sistema avançado de permissões por módulo.
- Integração com múltiplas APIs de busca além da escolhida.

---

## 26. Decisões Arquiteturais Importantes

### Backend separado?

Não criar backend separado no MVP.

Usar:

```txt
Next.js API/Server Actions para operações rápidas
Worker separado para tarefas pesadas
```

Criar backend separado apenas se:

- A API virar produto público.
- Houver múltiplos clientes além do web app.
- O domínio de negócio ficar grande demais.
- O Next.js começar a acumular responsabilidades indevidas.
- Houver necessidade real de serviço backend persistente.

### Admin separado?

Não criar app admin separado no MVP.

Usar:

```txt
apps/web/src/app/(admin)
```

Criar app separado apenas se:

- Admin tiver ciclo de deploy próprio.
- Time separado mantiver o admin.
- Exigências de segurança/infra justificarem.
- O app público/cliente ficar muito grande.

### Fila com Redis?

Não começar com Redis se a fila em Postgres resolver.

Começar com:

```txt
scan_jobs no PostgreSQL
```

Migrar para:

```txt
BullMQ + Redis
```

quando a escala exigir.

---

## 27. Experiência do Usuário

O usuário não deve precisar entender o processamento técnico.

Estados claros:

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

A interface deve deixar claro:

- Nem toda ocorrência é infração.
- A validação humana é necessária.
- O score é apoio, não veredito.
- Screenshot pode falhar mesmo com URL válida.
- O relatório é uma evidência inicial, não garantia jurídica definitiva.

---

## 28. Princípio Técnico do Projeto

A frase-guia:

```txt
Next.js cuida da experiência e operação.
Worker cuida do processamento pesado.
PostgreSQL organiza o estado.
R2 guarda os arquivos e evidências.
Google Vision entrega o core inicial de busca reversa.
Humano valida a ocorrência.
```

Sempre que houver dúvida arquitetural, seguir este princípio.

---

## 29. Como o Codex Deve Trabalhar Neste Projeto

Ao receber uma tarefa:

1. Ler este arquivo primeiro.
2. Identificar qual app/pacote será afetado.
3. Preservar a separação entre web, worker, db e shared.
4. Evitar criar arquitetura nova sem necessidade.
5. Preferir mudanças pequenas e revisáveis.
6. Atualizar types, schemas e validações quando necessário.
7. Criar ou ajustar testes quando houver estrutura de testes.
8. Não introduzir dependências pesadas sem justificativa.
9. Não mover regras pesadas para o frontend.
10. Não colocar tarefas longas em request HTTP do Next.js.

Antes de finalizar uma alteração:

- Rodar typecheck.
- Rodar lint, se disponível.
- Rodar testes, se disponíveis.
- Verificar se não há secrets em arquivos.
- Verificar se a alteração respeita multi-tenant por `organization_id`.
- Verificar se não há vazamento de dados entre clientes.

---

## 30. Checklist de Qualidade

Antes de considerar uma tarefa concluída, verificar:

```txt
[ ] Código compila.
[ ] Types estão corretos.
[ ] Validações existem no servidor.
[ ] Erros são tratados.
[ ] Não há `any` desnecessário.
[ ] Não há secrets expostos.
[ ] Não há processamento pesado no Next.js.
[ ] Worker é idempotente quando necessário.
[ ] Detecções não são duplicadas.
[ ] Dados respeitam `organization_id`.
[ ] Logs têm contexto suficiente.
[ ] UI mostra estados claros.
[ ] Mudança segue a arquitetura do projeto.
```

---

## 31. Tomada de Decisão

Em caso de dúvida:

- Escolher simplicidade operacional.
- Proteger a possibilidade de escala futura.
- Evitar abstração prematura.
- Priorizar entrega do core.
- Manter o domínio do produto claro.
- Não mascarar limitação técnica.
- Registrar decisões importantes em `docs/architecture.md`.

A prioridade do MVP é validar valor, não provar sofisticação técnica.


<!-- END:nextjs-agent-rules -->
