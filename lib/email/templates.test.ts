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
