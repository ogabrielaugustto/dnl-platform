"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/auth";

type OrganizationActionState = {
  message?: string;
  status?: "error" | "success";
};

const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres para a organizacao."),
});

export async function switchOrganizationAction(formData: FormData) {
  const organizationId = formData.get("organizationId");

  if (typeof organizationId !== "string" || organizationId.length === 0) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  refresh();
}

export async function createOrganizationAction(
  _: OrganizationActionState,
  formData: FormData,
): Promise<OrganizationActionState> {
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Sua sessao expirou. Entre novamente.",
    };
  }

  const { data, error } = await supabase.rpc("create_organization", {
    organization_name: parsed.data.name,
    organization_document: null,
    organization_billing_email: user.email ?? null,
  });

  if (error || typeof data !== "string") {
    return {
      status: "error",
      message: "Nao foi possivel criar a organizacao agora.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, data, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  refresh();

  return {
    status: "success",
    message: "Organizacao criada com sucesso.",
  };
}
