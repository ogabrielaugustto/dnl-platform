# Home Sales LP Design

## Goal

Rebuild the public home page as a polished sales landing page for Direito na Lente, with a hybrid acquisition motion where self-serve account creation is the primary path and talking to DNL is the secondary path.

## Motion

- Primary motion: self-serve trial/account creation.
- Secondary motion: consultative contact for larger or more sensitive operations.
- Primary CTA: `Comecar teste gratis`.
- Secondary CTA: `Falar com a DNL`.
- Pricing remains real and database-backed.

## Audience

The page speaks to photographers, agencies, studios, visual-content teams, and brands that own image assets and need to monitor where those images appear online.

## Positioning

The page must make the visitor understand in the first viewport that Direito na Lente helps them monitor image usage, organize occurrences, review evidence, and hand off unauthorized-use cases to DNL with human support.

The product must not claim that every detection is an infringement. It should keep the product language precise:

- `ocorrencia` before human review.
- `possivel infracao` only after the user validates unauthorized use.
- DNL support after handoff, not fully automated legal action by the client alone.

## Page Structure

1. Hero with clear value proposition, self-serve CTA, secondary contact CTA, and product mockup.
2. Problem section naming the operational pain of discovering unauthorized image usage too late.
3. Workflow section showing upload, monitoring, occurrence review, and DNL handoff.
4. Product proof section with a more credible dashboard-style mockup.
5. Benefit section translating features into daily operational outcomes.
6. Audience-fit section qualifying who the platform is for.
7. Pricing section using existing plan data from `listBillingPlansFromDatabase()`.
8. Security/trust section with truthful claims only: LGPD direction, authenticated access, organization separation, privacy/terms.
9. FAQ section covering adoption, trial, occurrences versus infringement, unauthorized handoff, and data safety.
10. Final CTA section.

## Visual Direction

- Preserve the platform blue primary color.
- Use a light, editorial SaaS layout with dense product moments rather than generic marketing cards.
- Use controlled dark-blue product mockups to create contrast.
- Keep cards at restrained radii and avoid nested card-heavy composition.
- Use visual product surfaces as arguments: dashboard mockups, occurrence rows, evidence/status chips, and workflow panels.
- Do not invent logos, metrics, testimonials, integrations, or certifications.

## Implementation Constraints

- Keep the page server-rendered.
- Do not introduce heavy client-side behavior.
- Do not move monitoring, screenshotting, evidence generation, or legal processing into the Next.js request path.
- Keep public shell changes small and avoid touching protected app flows.
- Preserve tenant/security language accuracy.
- Verify typecheck with `node_modules\\.bin\\tsc.cmd --noEmit`.

