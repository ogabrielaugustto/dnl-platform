import assert from "node:assert/strict";
import test from "node:test";

const {
  buildWorkspaceSuggestion,
  fetchBrasilApiCompany,
  fetchViaCepAddress,
  formatRegistrationDocument,
  formatRegistrationPhone,
  formatPostalCode,
  formatResolvedAddressLine,
  normalizeBrasilApiCompany,
  normalizePhone,
  normalizePostalCode,
  parseRegistrationDocument,
  validateRegistrationPhone,
  validateOnboardingAddress,
} = await import(new URL("./customer-onboarding.ts", import.meta.url).href);

test("parses a valid CPF registration document", () => {
  const result = parseRegistrationDocument("123.456.789-09");

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.document.type, "cpf");
  assert.equal(result.document.value, "12345678909");
});

test("parses a valid CNPJ registration document", () => {
  const result = parseRegistrationDocument("11.222.333/0001-81");

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.document.type, "cnpj");
  assert.equal(result.document.value, "11222333000181");
});

test("rejects invalid registration documents", () => {
  const result = parseRegistrationDocument("11.111.111/1111-11");

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.message, "Informe um CPF ou CNPJ valido.");
});

test("normalizes brazilian phone numbers", () => {
  assert.equal(normalizePhone("(11) 99876-5432"), "11998765432");
  assert.equal(normalizePhone("+55 (11) 99876-5432"), "5511998765432");
});

test("formats registration phone values as the user types", () => {
  assert.equal(formatRegistrationPhone("11987654321"), "(11) 98765-4321");
  assert.equal(formatRegistrationPhone("5511987654321"), "+55 (11) 98765-4321");
});

test("validates required registration phone numbers", () => {
  const result = validateRegistrationPhone("(11) 99876-5432");

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.phone, "11998765432");
});

test("rejects invalid registration phone numbers", () => {
  const result = validateRegistrationPhone("12345");

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.message, "Informe um celular valido.");
});

test("formats CPF and CNPJ values as the user types", () => {
  assert.equal(formatRegistrationDocument("12345678909"), "123.456.789-09");
  assert.equal(
    formatRegistrationDocument("11222333000181"),
    "11.222.333/0001-81",
  );
});

test("normalizes postal code values", () => {
  assert.equal(normalizePostalCode("01310-100"), "01310100");
});

test("formats postal code values as the user types", () => {
  assert.equal(formatPostalCode("01310100"), "01310-100");
  assert.equal(formatPostalCode("01310"), "01310");
});

test("formats a resolved address line with number and complement", () => {
  assert.equal(
    formatResolvedAddressLine({
      street: "Avenida Paulista",
      neighborhood: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
      number: "1000",
      complement: "10 andar",
    }),
    "Avenida Paulista, 1000, 10 andar • Bela Vista • Sao Paulo - SP",
  );
});

test("builds workspace suggestion from trade name, legal name, or profile name", () => {
  assert.equal(
    buildWorkspaceSuggestion({
      fullName: "Ana Souza",
      documentType: "cnpj",
      company: {
        tradeName: "Studio Ana",
        legalName: "Ana Souza Fotografia LTDA",
      },
    }),
    "Studio Ana",
  );

  assert.equal(
    buildWorkspaceSuggestion({
      fullName: "Ana Souza",
      documentType: "cnpj",
      company: {
        tradeName: null,
        legalName: "Ana Souza Fotografia LTDA",
      },
    }),
    "Ana Souza Fotografia LTDA",
  );

  assert.equal(
    buildWorkspaceSuggestion({
      fullName: "Ana Souza",
      documentType: "cpf",
      company: null,
    }),
    "Workspace de Ana Souza",
  );
});

test("normalizes Brasil API company snapshots", () => {
  const company = normalizeBrasilApiCompany({
    cnpj: "11.222.333/0001-81",
    razao_social: "Ana Souza Fotografia LTDA",
    nome_fantasia: "Studio Ana",
    cep: "01310-100",
    logradouro: "Avenida Paulista",
    numero: "1000",
    complemento: "10 andar",
    bairro: "Bela Vista",
    municipio: "Sao Paulo",
    uf: "SP",
    email: "financeiro@studioana.com",
    ddd_telefone_1: "1133334444",
  });

  assert.deepEqual(company, {
    cnpj: "11222333000181",
    legalName: "Ana Souza Fotografia LTDA",
    tradeName: "Studio Ana",
    postalCode: "01310100",
    street: "Avenida Paulista",
    number: "1000",
    complement: "10 andar",
    neighborhood: "Bela Vista",
    city: "Sao Paulo",
    state: "SP",
    billingEmail: "financeiro@studioana.com",
    contactPhone: "1133334444",
  });
});

test("returns normalized company data from Brasil API", async () => {
  const company = await fetchBrasilApiCompany("11222333000181", {
    fetchImplementation: async () =>
      new Response(
        JSON.stringify({
          cnpj: "11.222.333/0001-81",
          razao_social: "Ana Souza Fotografia LTDA",
          nome_fantasia: "Studio Ana",
          cep: "01310-100",
          logradouro: "Avenida Paulista",
          numero: "1000",
          complemento: "10 andar",
          bairro: "Bela Vista",
          municipio: "Sao Paulo",
          uf: "SP",
          email: "financeiro@studioana.com",
          ddd_telefone_1: "1133334444",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
  });

  assert.deepEqual(company, {
    cnpj: "11222333000181",
    legalName: "Ana Souza Fotografia LTDA",
    tradeName: "Studio Ana",
    postalCode: "01310100",
    street: "Avenida Paulista",
    number: "1000",
    complement: "10 andar",
    neighborhood: "Bela Vista",
    city: "Sao Paulo",
    state: "SP",
    billingEmail: "financeiro@studioana.com",
    contactPhone: "1133334444",
  });
});

test("swallows Brasil API failures and returns null", async () => {
  const company = await fetchBrasilApiCompany("11222333000181", {
    fetchImplementation: async () => new Response("erro", { status: 500 }),
  });

  assert.equal(company, null);
});

test("returns normalized address data from ViaCEP", async () => {
  const address = await fetchViaCepAddress("01310100", {
    fetchImplementation: async () =>
      new Response(
        JSON.stringify({
          cep: "01310-100",
          logradouro: "Avenida Paulista",
          complemento: "",
          bairro: "Bela Vista",
          localidade: "Sao Paulo",
          uf: "SP",
          erro: false,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
  });

  assert.deepEqual(address, {
    postalCode: "01310100",
    street: "Avenida Paulista",
    neighborhood: "Bela Vista",
    city: "Sao Paulo",
    state: "SP",
  });
});

test("returns null when ViaCEP responds with missing address", async () => {
  const address = await fetchViaCepAddress("01310100", {
    fetchImplementation: async () =>
      new Response(JSON.stringify({ erro: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
  });

  assert.equal(address, null);
});

test("validates onboarding address with optional complement", () => {
  const result = validateOnboardingAddress({
    postalCode: "01310-100",
    number: "1000",
    complement: "",
    hasNoComplement: true,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.address, {
    postalCode: "01310100",
    number: "1000",
    complement: null,
  });
});

test("rejects onboarding address when complement is required but empty", () => {
  const result = validateOnboardingAddress({
    postalCode: "01310-100",
    number: "1000",
    complement: " ",
    hasNoComplement: false,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.message, "Informe o complemento ou marque que o endereco nao possui complemento.");
});
