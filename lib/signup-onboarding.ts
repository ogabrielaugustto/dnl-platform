import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

export const CUSTOMER_ONBOARDING_FLOW_VERSION = "2026-06-12";
export const REGISTRATION_TERMS_VERSION = "2026-06-12";
export const AUTHORIZATION_TERMS_VERSION = "2026-06-12";
export const PENDING_SIGNUP_ONBOARDING_COOKIE = "dnl_signup_onboarding";

const pendingSignupOnboardingSchema = z.object({
  userId: z.uuid(),
  fullName: z.string().min(1),
  email: z.email(),
  organizationName: z.string().min(1),
  requiresEmailConfirmation: z.boolean(),
  registrationTermsAcceptedAt: z.string().datetime(),
  flowVersion: z.string().min(1),
});

export type PendingSignupOnboarding = z.infer<
  typeof pendingSignupOnboardingSchema
>;

function getSigningSecret() {
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error("SUPABASE_SECRET_KEY is required to sign onboarding cookies.");
  }

  return secret;
}

function signCookieValue(payload: string) {
  return createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function serializePendingSignupOnboarding(
  value: PendingSignupOnboarding,
) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = signCookieValue(payload);

  return `${payload}.${signature}`;
}

function deserializePendingSignupOnboarding(
  value: string,
): PendingSignupOnboarding | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signCookieValue(payload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    const result = pendingSignupOnboardingSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function getPendingSignupOnboarding() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(PENDING_SIGNUP_ONBOARDING_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  const parsed = deserializePendingSignupOnboarding(rawValue);

  if (!parsed) {
    cookieStore.delete(PENDING_SIGNUP_ONBOARDING_COOKIE);
    return null;
  }

  return parsed;
}

export async function setPendingSignupOnboarding(
  value: PendingSignupOnboarding,
) {
  const cookieStore = await cookies();

  cookieStore.set(
    PENDING_SIGNUP_ONBOARDING_COOKIE,
    serializePendingSignupOnboarding(value),
    {
      httpOnly: true,
      maxAge: 60 * 60 * 12,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
}

export async function clearPendingSignupOnboarding() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_SIGNUP_ONBOARDING_COOKIE);
}
