import assert from "node:assert/strict";
import test from "node:test";

const {
  buildWhatsAppUrl,
  isMissingPlatformSettingsTableError,
  parseAdminPlatformContactForm,
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
