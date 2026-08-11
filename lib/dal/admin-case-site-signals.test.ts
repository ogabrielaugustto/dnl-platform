import assert from "node:assert/strict";
import test from "node:test";

const { buildCaseSiteSignals } = await import(
  new URL("./admin-case-site-signals.ts", import.meta.url).href
);

test("buildCaseSiteSignals promotes domain owner intel into case contact signals", () => {
  const signals = buildCaseSiteSignals({
    siteSnapshots: [
      {
        siteName: "Folha de S.Paulo",
        cnpjCandidates: [],
        emails: [],
        phones: [],
      },
    ],
    investigations: [
      {
        primaryEmail: null,
        primaryPhone: null,
        primaryCnpj: null,
        contactCandidates: [
          {
            type: "email",
            value: "leitor@grupofolha.com.br",
          },
        ],
        domainOwner: {
          name: "Universo Online S.A.",
          organization: "Universo Online S.A.",
          document: "01.109.184/0004-38",
          email: "l-registrobr-uol@corp.uol.com.br",
          sourceType: "rdap",
          sourceUrl: "https://rdap.registro.br/domain/uol.com.br",
          contactStatus: "found",
        },
      },
    ],
  });

  assert.equal(signals.siteName, "Folha de S.Paulo");
  assert.deepEqual(signals.emails, [
    "l-registrobr-uol@corp.uol.com.br",
    "leitor@grupofolha.com.br",
  ]);
  assert.deepEqual(signals.cnpjCandidates, ["01.109.184/0004-38"]);
  assert.equal(signals.domainOwner?.organization, "Universo Online S.A.");
  assert.equal(signals.domainOwner?.email, "l-registrobr-uol@corp.uol.com.br");
});

test("identifies a database missing the optional domain owner columns", async () => {
  const { isMissingSiteIntelDomainOwnerSchemaError } = await import(
    new URL("./admin-case-site-signals.ts", import.meta.url).href
  );

  assert.equal(
    isMissingSiteIntelDomainOwnerSchemaError({
      code: "42703",
      message:
        "column detection_site_intel_investigations.domain_owner_name does not exist",
    }),
    true,
  );
  assert.equal(
    isMissingSiteIntelDomainOwnerSchemaError({
      code: "42501",
      message: "permission denied",
    }),
    false,
  );
});
