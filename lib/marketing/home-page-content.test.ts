import assert from "node:assert/strict";
import test from "node:test";

const {
  homeAudienceItems,
  homeBenefitCards,
  homeFaqItems,
  homeHero,
  homeProblemPoints,
  homeTrustItems,
  homeWorkflowSteps,
}: typeof import("./home-page-content") = await import(
  new URL("./home-page-content.ts", import.meta.url).href
);

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

  assert.doesNotMatch(
    allCopy,
    /SOC ?2|ISO ?27001|líder de mercado|milhares de clientes/i,
  );
  assert.match(allCopy, /ocorrências/i);
  assert.match(allCopy, /uso não autorizado/i);
});

