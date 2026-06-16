import "server-only";

import { z } from "zod";
import { Resend } from "resend";
import {
  buildContactLeadEmail,
  buildPasswordRecoveryEmail,
  buildWelcomeEmail,
} from "@/lib/email/templates";

const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.email(),
  RESEND_REPLY_TO_EMAIL: z.email().optional(),
  CONTACT_INBOX_EMAIL: z.email().optional(),
  APP_URL: z.url(),
});

let resendClient: Resend | null = null;

function getResendEnv() {
  return resendEnvSchema.parse(process.env);
}

function getResendClient() {
  const env = getResendEnv();

  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return { client: resendClient, env };
}

async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const { client, env } = getResendClient();
  const { error } = await client.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
    text,
    replyTo: replyTo ?? env.RESEND_REPLY_TO_EMAIL,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function getAppUrl() {
  return getResendEnv().APP_URL.replace(/\/$/, "");
}

export async function sendWelcomeEmail({
  to,
  fullName,
}: {
  to: string;
  fullName: string;
}) {
  const appUrl = getAppUrl();
  const email = buildWelcomeEmail({
    fullName,
    dashboardUrl: `${appUrl}/dashboard`,
    loginUrl: `${appUrl}/auth/login`,
  });

  await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendPasswordRecoveryEmail({
  to,
  recoveryUrl,
}: {
  to: string;
  recoveryUrl: string;
}) {
  const appUrl = getAppUrl();
  const email = buildPasswordRecoveryEmail({
    recoveryUrl,
    supportUrl: `${appUrl}/contato`,
  });

  await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

export async function sendContactLeadEmail({
  name,
  email,
  organization,
  message,
}: {
  name: string;
  email: string;
  organization: string | null;
  message: string;
}) {
  const env = getResendEnv();

  if (!env.CONTACT_INBOX_EMAIL) {
    throw new Error("CONTACT_INBOX_EMAIL nao configurado.");
  }

  const content = buildContactLeadEmail({
    name,
    email,
    organization,
    message,
  });

  await sendEmail({
    to: env.CONTACT_INBOX_EMAIL,
    subject: content.subject,
    html: content.html,
    text: content.text,
    replyTo: email,
  });
}
