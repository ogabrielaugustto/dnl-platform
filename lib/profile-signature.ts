import type { SignatureInputMode } from "./signature";
import { serializeSignaturePayload, validateSignaturePayload } from "./signature";

type ProfileSignatureSource = {
  signature_mode?: SignatureInputMode | null;
  signature_payload?: unknown;
  signature_signed_name?: string | null;
  signature_svg?: string | null;
  signature_updated_at?: string | null;
};

export type NormalizedProfileSignature =
  | {
      mode: SignatureInputMode;
      payloadJson: string;
      signedName: string;
      svg: string;
      updatedAt: string;
    }
  | null;

export function hasMissingProfileSignatureFieldsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42703" ||
    combinedMessage.includes("signature_mode") ||
    combinedMessage.includes("signature_payload") ||
    combinedMessage.includes("signature_signed_name") ||
    combinedMessage.includes("signature_svg") ||
    combinedMessage.includes("signature_updated_at")
  );
}

export function normalizeProfileSignature(
  source: ProfileSignatureSource,
): NormalizedProfileSignature {
  const signatureValidation =
    source.signature_payload != null
      ? validateSignaturePayload(source.signature_payload)
      : null;

  if (
    !signatureValidation?.ok ||
    !source.signature_mode ||
    !source.signature_signed_name ||
    !source.signature_svg ||
    !source.signature_updated_at
  ) {
    return null;
  }

  return {
    mode: source.signature_mode,
    payloadJson: serializeSignaturePayload(signatureValidation.payload),
    signedName: source.signature_signed_name,
    svg: source.signature_svg,
    updatedAt: source.signature_updated_at,
  };
}
