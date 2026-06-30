type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

type WelcomeEmailParams = {
  fullName: string;
  actionLabel: string;
  actionUrl: string;
  accessContext?: string;
  dashboardUrl: string;
  isFirstAccess: boolean;
};

type PasswordRecoveryEmailParams = {
  recoveryUrl: string;
  supportUrl: string;
};

type ContactLeadEmailParams = {
  name: string;
  email: string;
  organization: string | null;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createEmailLayout({
  eyebrow,
  title,
  body,
  actionLabel,
  actionUrl,
  note,
}: {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  note?: string;
}) {
  const actionMarkup =
    actionLabel && actionUrl
      ? `<p style="margin:32px 0 0;">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#eff6ff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;box-shadow:0 14px 28px rgba(37,99,235,0.28);">
            ${escapeHtml(actionLabel)}
          </a>
        </p>`
      : "";

  const noteMarkup = note
    ? `<p style="margin:28px 0 0;color:#64748b;font-size:13px;line-height:1.7;">${escapeHtml(note)}</p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="padding:32px 16px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid rgba(37,99,235,0.1);box-shadow:0 24px 70px rgba(15,23,42,0.08);">
        <div style="padding:28px;background:radial-gradient(circle at top left,rgba(147,197,253,0.9),transparent 30%),linear-gradient(135deg,#0f172a,#162338 55%,#1d4ed8 100%);color:#ffffff;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(239,246,255,0.72);">
            ${escapeHtml(eyebrow)}
          </p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:30px 28px 32px;">
          <div style="font-size:16px;line-height:1.8;color:#334155;">${body}</div>
          ${actionMarkup}
          ${noteMarkup}
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function buildWelcomeEmail({
  fullName,
  actionLabel,
  actionUrl,
  accessContext,
  dashboardUrl,
  isFirstAccess,
}: WelcomeEmailParams): EmailContent {
  const safeName = escapeHtml(fullName);
  const contextMarkup = accessContext
    ? `<div style="margin:18px 0 0;padding:16px 18px;border-radius:20px;background:#eff6ff;border:1px solid rgba(37,99,235,0.12);color:#1e3a8a;">
        ${escapeHtml(accessContext)}
      </div>`
    : "";
  const title = isFirstAccess
    ? "Sua conta ja esta pronta para comecar"
    : "Seu acesso ja pode ser usado na plataforma";
  const bodyLead = isFirstAccess
    ? "Sua conta na Direito na Lente foi criada. A plataforma foi pensada para organizar ativos, acompanhar ocorrencias e apoiar a revisao humana com mais contexto operacional."
    : "Seu acesso na Direito na Lente foi preparado para acompanhar ativos, varreduras e ocorrencias da sua organizacao em um unico fluxo.";
  const bodyFollowUp = isFirstAccess
    ? "Assim que voce entrar, ja pode cadastrar as primeiras imagens e iniciar a estrutura de monitoramento da sua organizacao."
    : "Assim que voce entrar, o painel ja estara pronto para continuar o acompanhamento do monitoramento e das revisoes pendentes.";

  return {
    subject: "Sua conta na Direito na Lente foi criada",
    text: `Ola, ${fullName}. Sua conta na Direito na Lente foi criada. ${bodyLead} ${accessContext ? `${accessContext} ` : ""}${actionLabel}: ${actionUrl}. Quando quiser acompanhar o painel, ele estara disponivel em ${dashboardUrl}.`,
    html: createEmailLayout({
      eyebrow: "Boas-vindas",
      title,
      body: `
        <p style="margin:0;">Ola, <strong>${safeName}</strong>.</p>
        <p style="margin:16px 0 0;">
          ${bodyLead}
        </p>
        <p style="margin:16px 0 0;">
          ${bodyFollowUp}
        </p>
        ${contextMarkup}
      `,
      actionLabel,
      actionUrl,
      note: `Depois do primeiro acesso, voce tambem podera acompanhar o painel em ${dashboardUrl}.`,
    }),
  };
}

export function buildPasswordRecoveryEmail({
  recoveryUrl,
  supportUrl,
}: PasswordRecoveryEmailParams): EmailContent {
  return {
    subject: "Recuperacao de senha da Direito na Lente",
    text: `Recebemos um pedido para redefinir sua senha. Use este link para continuar: ${recoveryUrl}. Se voce nao solicitou a recuperacao, ignore esta mensagem. Ajuda: ${supportUrl}.`,
    html: createEmailLayout({
      eyebrow: "Recuperacao",
      title: "Redefina sua senha com seguranca",
      body: `
        <p style="margin:0;">
          Recebemos um pedido para redefinir a senha da sua conta na Direito na Lente.
        </p>
        <p style="margin:16px 0 0;">
          Clique no botao abaixo para abrir a tela segura de redefinicao.
          Se voce nao fez esta solicitacao, basta ignorar este e-mail.
        </p>
      `,
      actionLabel: "Redefinir senha",
      actionUrl: recoveryUrl,
      note: `Se precisar de apoio, responda pelo fluxo da plataforma ou acompanhe em ${supportUrl}.`,
    }),
  };
}

export function buildContactLeadEmail({
  name,
  email,
  organization,
  message,
}: ContactLeadEmailParams): EmailContent {
  const orgLine = organization?.trim() ? `<p><strong>Organizacao:</strong> ${escapeHtml(organization)}</p>` : "";

  return {
    subject: `Novo contato institucional: ${name}`,
    text: `Nome: ${name}\nEmail: ${email}\nOrganizacao: ${organization ?? "-"}\n\nMensagem:\n${message}`,
    html: createEmailLayout({
      eyebrow: "Contato",
      title: "Nova mensagem recebida pelo site",
      body: `
        <p style="margin:0;"><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p style="margin:12px 0 0;"><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        ${orgLine}
        <p style="margin:20px 0 8px;"><strong>Mensagem:</strong></p>
        <div style="padding:18px;border-radius:18px;background:#f8fafc;border:1px solid rgba(15,23,42,0.08);white-space:pre-wrap;">${escapeHtml(message)}</div>
      `,
    }),
  };
}
