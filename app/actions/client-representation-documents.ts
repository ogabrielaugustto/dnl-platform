"use server";

import { revalidatePath, refresh } from "next/cache";
import { requireWritableOrganization } from "@/lib/dal/assets";
import { requestClicksignSoaSignature } from "@/lib/dal/client-representation-documents";
import { validateSoaSignatureRequest } from "@/lib/clicksign/representation-documents";

export type SoaSignatureActionState = {
  message?: string;
  signerEmail?: string;
  status?: "error" | "success";
  representationStatus?: "already_signed" | "signature_requested";
};

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestSoaSignatureAction(
  _: SoaSignatureActionState,
  formData: FormData,
): Promise<SoaSignatureActionState> {
  const parsed = validateSoaSignatureRequest({
    fullName: getFormString(formData, "fullName"),
    email: getFormString(formData, "email"),
    cpf: getFormString(formData, "cpf"),
    maritalStatus: getFormString(formData, "maritalStatus"),
    address: getFormString(formData, "address"),
  });

  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.message,
    };
  }

  try {
    const { organizationId, userId } = await requireWritableOrganization();
    const result = await requestClicksignSoaSignature({
      organizationId,
      userId,
      data: parsed.data,
    });

    revalidatePath("/gallery");
    refresh();

    return {
      status: "success",
      signerEmail: result.document.signerEmail,
      representationStatus: result.status,
      message: result.message,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel solicitar a assinatura do SOA agora.",
    };
  }
}
