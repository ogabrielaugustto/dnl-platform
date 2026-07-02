import { z } from "zod";
import type { BrasilApiCompany, RegistrationDocument } from "@/lib/customer-onboarding";

export const CUSTOMER_ONBOARDING_FLOW_VERSION = "2026-07-01";
export const REGISTRATION_TERMS_VERSION = "2026-06-12";
export const PENDING_SIGNUP_ONBOARDING_COOKIE = "dnl_signup_onboarding";

const brasilApiCompanySchema = z.object({
  cnpj: z.string().length(14),
  legalName: z.string().nullable(),
  tradeName: z.string().nullable(),
  postalCode: z.string().nullable(),
  street: z.string().nullable(),
  number: z.string().nullable(),
  complement: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  billingEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
});

export const pendingSignupOnboardingSchema = z.object({
  userId: z.uuid(),
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(10).max(13),
  documentType: z.enum(["cpf", "cnpj"]),
  documentValue: z.string().min(11).max(14),
  company: brasilApiCompanySchema.nullable(),
  registrationTermsAcceptedAt: z.string().datetime(),
  flowVersion: z.string().min(1),
});

export type PendingSignupOnboarding = z.infer<
  typeof pendingSignupOnboardingSchema
>;

type PendingSignupOnboardingMetadataInput = {
  userId: string;
  email: string | null | undefined;
  userMetadata: Record<string, unknown>;
};

function readOptionalString(
  metadata: Record<string, unknown>,
  key: string,
) {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function buildPendingSignupOnboardingFromMetadata(
  input: PendingSignupOnboardingMetadataInput,
): PendingSignupOnboarding | null {
  const email = input.email?.trim();
  const fullName = readOptionalString(input.userMetadata, "full_name");
  const phone = readOptionalString(input.userMetadata, "phone");
  const documentType = readOptionalString(
    input.userMetadata,
    "registration_document_type",
  ) as RegistrationDocument["type"] | null;
  const documentValue = readOptionalString(
    input.userMetadata,
    "registration_document",
  );
  const registrationTermsAcceptedAt = readOptionalString(
    input.userMetadata,
    "registration_terms_accepted_at",
  );
  const flowVersion =
    readOptionalString(input.userMetadata, "customer_onboarding_flow_version") ??
    CUSTOMER_ONBOARDING_FLOW_VERSION;

  if (
    !email ||
    !fullName ||
    !phone ||
    !documentType ||
    !documentValue ||
    !registrationTermsAcceptedAt
  ) {
    return null;
  }

  const company =
    documentType === "cnpj"
      ? ({
          cnpj: documentValue,
          legalName: readOptionalString(input.userMetadata, "company_legal_name"),
          tradeName: readOptionalString(input.userMetadata, "company_trade_name"),
          postalCode: readOptionalString(input.userMetadata, "company_postal_code"),
          street: readOptionalString(input.userMetadata, "company_street"),
          number: readOptionalString(input.userMetadata, "company_number"),
          complement: readOptionalString(input.userMetadata, "company_complement"),
          neighborhood: readOptionalString(
            input.userMetadata,
            "company_neighborhood",
          ),
          city: readOptionalString(input.userMetadata, "company_city"),
          state: readOptionalString(input.userMetadata, "company_state"),
          billingEmail: readOptionalString(
            input.userMetadata,
            "company_billing_email",
          ),
          contactPhone: readOptionalString(
            input.userMetadata,
            "company_contact_phone",
          ),
        } satisfies BrasilApiCompany)
      : null;

  const result = pendingSignupOnboardingSchema.safeParse({
    userId: input.userId,
    email,
    fullName,
    phone,
    documentType,
    documentValue,
    company,
    registrationTermsAcceptedAt,
    flowVersion,
  });

  return result.success ? result.data : null;
}
