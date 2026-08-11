"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import {
  requestAdminCaseSra,
  type AdminCaseSraFormInput,
} from "@/lib/dal/admin-case-sra";

const contextSchema = z.object({
  organizationId: z.uuid(),
  casePublicId: z.coerce.number().int().positive(),
});

export type AdminCaseSraActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialAdminCaseSraActionState: AdminCaseSraActionState = {
  status: "idle",
  message: "",
};

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestAdminCaseSraAction(
  _previousState: AdminCaseSraActionState,
  formData: FormData,
): Promise<AdminCaseSraActionState> {
  const contextResult = contextSchema.safeParse({
    organizationId: formData.get("organizationId"),
    casePublicId: formData.get("casePublicId"),
  });

  if (!contextResult.success) {
    return {
      status: "error",
      message: "O caso informado para o SRA e invalido.",
    };
  }

  const fieldNames: Array<keyof AdminCaseSraFormInput> = [
    "notifiedLegalName",
    "notifiedCnpj",
    "notifiedAddress",
    "notifiedDomain",
    "notifiedSignerName",
    "notifiedSignerEmail",
    "notifiedSignerCpf",
    "notifiedSignerRole",
    "photographerName",
    "photographerMaritalStatus",
    "photographerCpf",
    "photographerAddress",
    "dnlSignerName",
    "dnlSignerEmail",
    "dnlSignerCpf",
    "amount",
    "amountInWords",
    "paymentDueDate",
    "witness1Name",
    "witness1Email",
    "witness1Cpf",
    "witness2Name",
    "witness2Email",
    "witness2Cpf",
  ];
  const form = Object.fromEntries(
    fieldNames.map((field) => [field, stringValue(formData, field)]),
  ) as AdminCaseSraFormInput;

  try {
    const auth = await requirePanelAccess("admin");
    const result = await requestAdminCaseSra({
      ...contextResult.data,
      userId: auth.userId,
      form,
    });

    if (result.status === "validation_error") {
      return {
        status: "error",
        message: result.message,
        fieldErrors: {
          [result.field]: [result.message],
        },
      };
    }

    revalidatePath("/admin/cases");
    revalidatePath(
      `/admin/cases/${contextResult.data.organizationId}/${contextResult.data.casePublicId}`,
    );

    return {
      status: "success",
      message: result.message,
    };
  } catch (error) {
    console.error("admin_case_sra_request_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
      organizationId: contextResult.data.organizationId,
      casePublicId: contextResult.data.casePublicId,
    });

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar o SRA pela Clicksign.",
    };
  }
}
