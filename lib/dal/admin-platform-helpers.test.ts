import assert from "node:assert/strict";
import test from "node:test";

const {
  buildWhatsAppUrl,
  isMissingPlatformSettingsTableError,
  parseAdminPlatformContactForm,
  parseAdminPlatformGeneralForm,
}: typeof import("./admin-platform-helpers") = await import(
  new URL("./admin-platform-helpers.ts", import.meta.url).href
);

test("parseAdminPlatformContactForm converts contact settings into database values", () => {
  const formData = new FormData();
  formData.set("contactEmail", " atendimento@direitonalente.com.br ");
  formData.set("contactWhatsapp", " (11) 98888-7777 ");

  const parsed = parseAdminPlatformContactForm(formData);

  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, {
    values: {
      contact_email: "atendimento@direitonalente.com.br",
      contact_whatsapp: "(11) 98888-7777",
    },
  });
});

test("parseAdminPlatformContactForm rejects invalid contact email", () => {
  const formData = new FormData();
  formData.set("contactEmail", "nao-e-email");
  formData.set("contactWhatsapp", "");

  const parsed = parseAdminPlatformContactForm(formData);

  assert.equal(parsed.success, false);
  assert.equal(parsed.message, "Informe um e-mail de contato valido.");
});

test("parseAdminPlatformGeneralForm converts institutional settings into database values", () => {
  const formData = new FormData();
  formData.set("tradeName", " Direito Na Lente ");
  formData.set("legalName", " DNL Tecnologia Juridica LTDA ");
  formData.set("cnpj", " 11.222.333/0001-81 ");
  formData.set("institutionalEmail", " juridico@direitonalente.com.br ");
  formData.set("institutionalPhone", " (11) 97777-6666 ");
  formData.set("postalCode", " 01310-100 ");
  formData.set("addressLine", " Avenida Paulista ");
  formData.set("addressNumber", " 1000 ");
  formData.set("addressComplement", " Conjunto 1201 ");
  formData.set("district", " Bela Vista ");
  formData.set("city", " Sao Paulo ");
  formData.set("state", " sp ");
  formData.set("about", "  Plataforma de monitoramento de uso indevido de imagens.  ");
  formData.set("legalRepresentativeName", " Maria Silva ");
  formData.set("legalRepresentativeDocument", " 123.456.789-00 ");
  formData.set("legalRepresentativeRole", " Administradora ");
  formData.set("legalRepresentativePhone", " (11) 98888-7777 ");
  formData.set("legalRepresentativeEmail", " maria@direitonalente.com.br ");

  const parsed = parseAdminPlatformGeneralForm(formData);

  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, {
    values: {
      trade_name: "Direito Na Lente",
      legal_name: "DNL Tecnologia Juridica LTDA",
      cnpj: "11.222.333/0001-81",
      institutional_email: "juridico@direitonalente.com.br",
      institutional_phone: "(11) 97777-6666",
      postal_code: "01310-100",
      address_line: "Avenida Paulista",
      address_number: "1000",
      address_complement: "Conjunto 1201",
      district: "Bela Vista",
      city: "Sao Paulo",
      state: "SP",
      about: "Plataforma de monitoramento de uso indevido de imagens.",
      legal_representative_name: "Maria Silva",
      legal_representative_document: "123.456.789-00",
      legal_representative_role: "Administradora",
      legal_representative_phone: "(11) 98888-7777",
      legal_representative_email: "maria@direitonalente.com.br",
    },
  });
});

test("parseAdminPlatformGeneralForm converts blank optional values to null", () => {
  const parsed = parseAdminPlatformGeneralForm(new FormData());

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.values.trade_name, null);
  assert.equal(parsed.data.values.address_complement, null);
  assert.equal(parsed.data.values.legal_representative_email, null);
});

test("parseAdminPlatformGeneralForm rejects invalid institutional fields", () => {
  const invalidCnpj = new FormData();
  invalidCnpj.set("cnpj", "123");
  assert.deepEqual(parseAdminPlatformGeneralForm(invalidCnpj), {
    message: "Informe um CNPJ com 14 digitos.",
    success: false,
  });

  const invalidPostalCode = new FormData();
  invalidPostalCode.set("postalCode", "01310");
  assert.deepEqual(parseAdminPlatformGeneralForm(invalidPostalCode), {
    message: "Informe um CEP com 8 digitos.",
    success: false,
  });

  const invalidState = new FormData();
  invalidState.set("state", "SPO");
  assert.deepEqual(parseAdminPlatformGeneralForm(invalidState), {
    message: "Informe a UF com 2 letras.",
    success: false,
  });

  const invalidEmail = new FormData();
  invalidEmail.set("legalRepresentativeEmail", "nao-e-email");
  assert.deepEqual(parseAdminPlatformGeneralForm(invalidEmail), {
    message: "Informe um e-mail valido para o representante legal.",
    success: false,
  });
});

test("buildWhatsAppUrl formats Brazilian and international phone numbers", () => {
  assert.equal(
    buildWhatsAppUrl("(11) 98888-7777"),
    "https://wa.me/5511988887777",
  );
  assert.equal(
    buildWhatsAppUrl("+1 (415) 555-0199"),
    "https://wa.me/14155550199",
  );
  assert.equal(buildWhatsAppUrl(""), null);
  assert.equal(buildWhatsAppUrl(null), null);
});

test("isMissingPlatformSettingsTableError detects missing platform settings table errors only", () => {
  assert.equal(
    isMissingPlatformSettingsTableError({
      code: "PGRST205",
      message:
        "Could not find the table 'public.platform_settings' in the schema cache",
    }),
    true,
  );
  assert.equal(
    isMissingPlatformSettingsTableError({
      code: "42P01",
      message: 'relation "public.platform_settings" does not exist',
    }),
    true,
  );
  assert.equal(
    isMissingPlatformSettingsTableError({
      code: "42501",
      message: "permission denied for table platform_settings",
    }),
    false,
  );
});
