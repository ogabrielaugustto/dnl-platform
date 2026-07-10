# Home Sales LP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public home page as a hybrid self-serve sales LP for Direito na Lente.

**Architecture:** Keep the public page as a Server Component and move reusable landing copy/data into a pure TypeScript content module that can be tested without rendering Next.js. The page imports that content, fetches pricing plans from the existing DAL, and renders an editorial SaaS layout with product mockups built in JSX/CSS.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, lucide-react already present in the app, Supabase-backed billing DAL.

## Global Constraints

- Primary CTA is self-serve: `Começar teste grátis`.
- Secondary CTA is consultative: `Falar com a DNL`.
- Do not invent logos, metrics, testimonials, integrations, or certifications.
- Use `ocorrência` before validation; do not call every detection an infringement.
- Keep the client journey limited to upload, monitoring visibility, occurrence review, and handoff to DNL.
- Keep the page server-rendered.
- Run `node_modules\\.bin\\tsc.cmd --noEmit` before completion.

---

### Task 1: Landing Content Contract

**Files:**
- Create: `lib/marketing/home-page-content.ts`
- Create: `lib/marketing/home-page-content.test.ts`

**Interfaces:**
- Produces: `homeHero`, `homeProblemPoints`, `homeWorkflowSteps`, `homeBenefitCards`, `homeAudienceItems`, `homeTrustItems`, `homeFaqItems`
- Consumes: no local app code beyond TypeScript runtime.

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  homeAudienceItems,
  homeBenefitCards,
  homeFaqItems,
  homeHero,
  homeProblemPoints,
  homeTrustItems,
  homeWorkflowSteps,
} from "./home-page-content";

test("home landing content keeps the approved hybrid self-serve motion", () => {
  assert.equal(homeHero.primaryCta.label, "Começar teste grátis");
  assert.equal(homeHero.primaryCta.href, "/auth/register");
  assert.equal(homeHero.secondaryCta.label, "Falar com a DNL");
  assert.equal(homeHero.secondaryCta.href, "/contato");
  assert.match(homeHero.eyebrow, /monitoramento de imagens/i);
});

test("home landing content avoids unsupported proof claims", () => {
  const allCopy = [
    homeHero.headline,
    homeHero.description,
    ...homeProblemPoints.map((item) => item.description),
    ...homeWorkflowSteps.map((item) => `${item.title} ${item.description}`),
    ...homeBenefitCards.map((item) => `${item.title} ${item.description}`),
    ...homeAudienceItems,
    ...homeTrustItems.map((item) => `${item.title} ${item.description}`),
    ...homeFaqItems.map((item) => `${item.question} ${item.answer}`),
  ].join(" ");

  assert.doesNotMatch(allCopy, /SOC ?2|ISO ?27001|líder de mercado|milhares de clientes/i);
  assert.match(allCopy, /ocorrências/i);
  assert.match(allCopy, /uso não autorizado/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types lib/marketing/home-page-content.test.ts`

Expected: FAIL because `lib/marketing/home-page-content.ts` does not exist yet.

- [ ] **Step 3: Implement content module**

Create the exported content arrays and objects with exact CTA labels, precise occurrence wording, and no unsupported proof claims.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types lib/marketing/home-page-content.test.ts`

Expected: PASS.

---

### Task 2: Rebuild Public Home Page

**Files:**
- Modify: `app/(public)/page.tsx`

**Interfaces:**
- Consumes: content exports from `lib/marketing/home-page-content.ts`
- Consumes: `listBillingPlansFromDatabase()` and `formatPlanPrice()` as the existing pricing source.

- [ ] **Step 1: Replace generic home sections with the approved LP sequence**

Render hero, problem, workflow, product mockup, benefits, audience fit, pricing, trust, FAQ, and final CTA.

- [ ] **Step 2: Keep the page server-rendered**

Do not add `"use client"`. Use CSS/JSX mockups and standard links/buttons only.

- [ ] **Step 3: Preserve real pricing**

Keep `const pricingPlans = await listBillingPlansFromDatabase();` and map the returned plans.

- [ ] **Step 4: Verify typecheck**

Run: `node_modules\\.bin\\tsc.cmd --noEmit`

Expected: PASS or only unrelated pre-existing errors if present.

---

### Task 3: Light Public Shell Alignment

**Files:**
- Modify: `components/marketing/site-shell.tsx` only if the new LP needs anchor navigation labels updated.

**Interfaces:**
- Consumes: public anchors rendered by `app/(public)/page.tsx`

- [ ] **Step 1: Align navigation labels**

Update nav anchors to match final sections, such as `Como funciona`, `Planos`, and `Contato`.

- [ ] **Step 2: Verify no route protection or auth behavior changed**

Confirm the shell still only renders public links and existing login/register buttons.

---

### Task 4: Visual Runtime Verification

**Files:**
- No source edits expected unless verification reveals layout issues.

**Interfaces:**
- Consumes: running Next.js app on port 4020 or an alternate available port.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Inspect the home page**

Open `http://localhost:4020/` and verify desktop/mobile layout, no horizontal overflow, readable CTAs, and visible product mockup.

- [ ] **Step 3: Run final static checks**

Run: `node --test --experimental-strip-types lib/marketing/home-page-content.test.ts`

Run: `node_modules\\.bin\\tsc.cmd --noEmit`

