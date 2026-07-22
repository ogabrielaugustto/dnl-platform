import assert from "node:assert/strict";
import test from "node:test";

test("buildWelcomeEmail renders a first-access CTA with dashboard follow-up", async () => {
  const { buildWelcomeEmail } = await import(new URL("./templates.ts", import.meta.url).href);
  const email = buildWelcomeEmail({
    fullName: "Maria Silva",
    actionLabel: "Definir acesso",
    actionUrl: "https://app.example.com/auth/confirm",
    dashboardUrl: "https://app.example.com/dashboard",
    isFirstAccess: true,
  });

  assert.equal(email.subject, "Sua conta na Direito na Lente foi criada");
  assert.match(email.html, /Definir acesso/);
  assert.match(email.html, /Maria Silva/);
  assert.match(email.html, /https:\/\/app\.example\.com\/auth\/confirm/);
  assert.match(email.text, /Definir acesso/);
  assert.match(email.text, /https:\/\/app\.example\.com\/dashboard/);
});

test("buildWelcomeEmail supports manual-access guidance without exposing a password", async () => {
  const { buildWelcomeEmail } = await import(new URL("./templates.ts", import.meta.url).href);
  const email = buildWelcomeEmail({
    fullName: "Carlos Souza",
    actionLabel: "Entrar na plataforma",
    actionUrl: "https://app.example.com/auth/login",
    dashboardUrl: "https://app.example.com/dashboard",
    isFirstAccess: false,
    accessContext:
      "Use a senha temporária compartilhada pela equipe da Direito na Lente para concluir o primeiro acesso.",
  });

  assert.match(email.html, /senha temporária compartilhada pela equipe/i);
  assert.match(email.text, /primeiro acesso/i);
  assert.doesNotMatch(email.html, /Dnl@/);
});

test("buildPasswordRecoveryEmail keeps the secure recovery CTA and support fallback", async () => {
  const { buildPasswordRecoveryEmail } = await import(
    new URL("./templates.ts", import.meta.url).href
  );
  const email = buildPasswordRecoveryEmail({
    recoveryUrl: "https://app.example.com/auth/confirm?token_hash=abc",
    supportUrl: "https://app.example.com/contato",
  });

  assert.equal(email.subject, "Recuperacao de senha da Direito na Lente");
  assert.match(email.html, /Redefinir senha/);
  assert.match(email.html, /token_hash=abc/);
  assert.match(email.text, /https:\/\/app\.example\.com\/contato/);
});

test("buildCaseCommunicationEmail wraps a case message without placeholders", async () => {
  const [{ buildCaseCommunicationSnapshot }, { buildCaseCommunicationEmail }] =
    await Promise.all([
      import(new URL("../admin-case-workflow.ts", import.meta.url).href),
      import(new URL("./templates.ts", import.meta.url).href),
    ]);
  const kinds = [
    "first_notice",
    "documentation_notice",
    "c1",
    "c1p",
    "c2",
    "negotiation",
  ] as const;

  for (const kind of kinds) {
    const snapshot = buildCaseCommunicationSnapshot(kind, {
      casePublicId: 123,
      clientName: "Cliente Exemplo",
      domain: "example.com",
      sourceUrl: "https://example.com/noticia",
      finalUrl: "https://example.com/noticia",
      assetTitle: "Foto editorial",
      notifiedName: "Empresa Notificada",
      notifiedEmail: "juridico@example.com",
      amountFormatted: "R$ 1.000,00",
      portalReference: "000123",
    });
    const email = buildCaseCommunicationEmail({
      subject: snapshot.subject,
      body: snapshot.body,
      casePublicIdLabel: "000123",
      clientName: "Cliente Exemplo",
      domain: "example.com",
      sourceUrl: "https://example.com/noticia",
      validationUrl:
        "https://app.example.com/validar-notificacao?codigo=000123&chave=ABCD-1234-EFGH-5678",
      validationCode: "ABCD-1234-EFGH-5678",
    });

    assert.match(email.subject, /000123|caso/i);
    assert.match(email.html, /example\.com/);
    assert.match(email.html, /Foto editorial|caso|noticia/i);
    assert.match(email.html, /Validar notifica/i);
    assert.match(email.html, /ABCD-1234-EFGH-5678/);
    assert.match(email.html, /https:\/\/app\.example\.com\/validar-notificacao\?codigo=000123&amp;chave=ABCD-1234-EFGH-5678/);
    assert.match(email.text, /https:\/\/example\.com\/noticia/);
    assert.match(email.text, /https:\/\/app\.example\.com\/validar-notificacao\?codigo=000123&chave=ABCD-1234-EFGH-5678/);
    assert.doesNotMatch(email.html, /\[|\]|\{|\}|PREENCHER|NOME COMPLETO/);
  }
});
