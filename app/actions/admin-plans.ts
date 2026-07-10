"use server";

import { revalidatePath } from "next/cache";
import { recordAdminActivity } from "@/lib/admin-activity";
import { requirePanelAccess } from "@/lib/auth";
import { parseAdminPlanForm } from "@/lib/dal/admin-plans-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminPlanActionState = {
  message?: string;
  status?: "error" | "success";
};

export async function updateAdminPlanAction(
  formData: FormData,
): Promise<AdminPlanActionState> {
  const context = await requirePanelAccess("admin");
  const parsed = parseAdminPlanForm(formData);

  if (!parsed.success) {
    return {
      message: parsed.message,
      status: "error",
    };
  }

  const admin = createAdminClient();
  const { data: plan, error: planError } = await admin
    .from("subscription_plans")
    .select("id, code, name")
    .eq("id", parsed.data.planId)
    .maybeSingle<{
      code: string;
      id: string;
      name: string;
    }>();

  if (planError || !plan) {
    return {
      message: "Plano nao encontrado para edicao.",
      status: "error",
    };
  }

  const { error: updateError } = await admin
    .from("subscription_plans")
    .update(parsed.data.values)
    .eq("id", parsed.data.planId);

  if (updateError) {
    return {
      message: "Nao foi possivel atualizar este plano agora.",
      status: "error",
    };
  }

  await recordAdminActivity({
    action: "subscription_plan_updated",
    entity: "subscription_plan",
    entityId: parsed.data.planId,
    metadata: {
      code: plan.code,
      previousName: plan.name,
      summary: `Plano ${plan.code} atualizado no painel admin.`,
      updatedFields: Object.keys(parsed.data.values),
    },
    userId: context.userId,
  });

  revalidatePath("/admin/platform");
  revalidatePath("/admin/plans");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/activities");

  return {
    message: "Plano atualizado com sucesso.",
    status: "success",
  };
}
