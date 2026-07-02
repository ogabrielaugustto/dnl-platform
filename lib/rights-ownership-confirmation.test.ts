import assert from "node:assert/strict";
import test from "node:test";

const {
  RIGHTS_OWNERSHIP_CONFIRMATION_TEMPLATE_VERSION,
  buildRightsOwnershipConfirmationDocument,
} = await import(new URL("./rights-ownership-confirmation.ts", import.meta.url).href);

test("builds the rights ownership confirmation document snapshot for one image", () => {
  const document = buildRightsOwnershipConfirmationDocument({
    assetPublicIds: [17],
    signerCpf: "12345678909",
    signerFullName: "Andre Cabral",
    signerRole: "Fotografo profissional",
    signingCity: "Sao Paulo",
    statementDate: "2026-06-30T12:00:00.000Z",
  });

  assert.equal(
    document.templateVersion,
    RIGHTS_OWNERSHIP_CONFIRMATION_TEMPLATE_VERSION,
  );
  assert.equal(document.assetPublicIds.length, 1);
  assert.equal(document.assetPublicIds[0], 17);
  assert.equal(document.statementDateDisplay, "Sao Paulo, 30 de junho de 2026.");
  assert.match(document.body, /Andre Cabral, Fotografo profissional/);
  assert.match(document.body, /CPF\/ME sob o n 123\.456\.789-09/);
  assert.match(document.body, /Imagem: 000017/);
});

test("keeps a stable snapshot even if caller data changes later", () => {
  const assetPublicIds = [23];
  const document = buildRightsOwnershipConfirmationDocument({
    assetPublicIds,
    signerCpf: "12345678909",
    signerFullName: "Andre Cabral",
    signerRole: "Fotografo profissional",
    signingCity: "Sao Paulo",
    statementDate: "2026-06-30T12:00:00.000Z",
  });

  assetPublicIds[0] = 99;

  assert.deepEqual(document.assetPublicIds, [23]);
  assert.match(document.body, /Imagem: 000023/);
});
