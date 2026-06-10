"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import {
  getDefaultNextRunAt,
  type MonitoringRuleFrequency,
} from "@/lib/dal/assets";
import { createClient } from "@/lib/server";

const updateClientScanFrequencySchema = z.object({
  organizationId: z.uuid(),
  frequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
});

async function getStarterPlanId() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("code", "starter")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    throw new Error("Plano padrao nao encontrado para configurar este cliente.");
  }

  return data.id;
}

export async function updateClientScanFrequencyAction(formData: FormData) {
  await requirePanelAccess("admin");

  const parsed = updateClientScanFrequencySchema.safeParse({
    organizationId: formData.get("organizationId"),
    frequency: formData.get("frequency"),
  });

  if (!parsed.success) {
    throw new Error("Frequencia invalida para este cliente.");
  }

  const { organizationId, frequency } = parsed.data;
  const supabase = await createClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .maybeSingle<{ id: string }>();

  if (organizationError || !organization) {
    throw new Error("Cliente nao encontrado.");
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", organizationId)
    .in("status", ["trialing", "active", "past_due", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (subscriptionError) {
    throw new Error("Nao foi possivel localizar a assinatura do cliente.");
  }

  if (subscription) {
    const { error } = await supabase
      .from("organization_subscriptions")
      .update({
        scan_frequency_cap_snapshot: frequency,
      })
      .eq("id", subscription.id)
      .eq("organization_id", organizationId);

    if (error) {
      throw new Error("Nao foi possivel atualizar a frequencia do cliente.");
    }
  } else {
    const starterPlanId = await getStarterPlanId();
    const { error } = await supabase.from("organization_subscriptions").insert({
      organization_id: organizationId,
      plan_id: starterPlanId,
      status: "active",
      provider: "manual",
      scan_frequency_cap_snapshot: frequency,
    });

    if (error) {
      throw new Error("Nao foi possivel criar a configuracao do cliente.");
    }
  }

  const { error: updateRulesError } = await supabase
    .from("monitoring_rules")
    .update({
      frequency: frequency as MonitoringRuleFrequency,
    })
    .eq("organization_id", organizationId)
    .is("archived_at", null);

  if (updateRulesError) {
    throw new Error("Nao foi possivel sincronizar as regras de monitoramento.");
  }

  const { error: updateActiveRulesError } = await supabase
    .from("monitoring_rules")
    .update({
      next_run_at: getDefaultNextRunAt(frequency),
    })
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .is("archived_at", null);

  if (updateActiveRulesError) {
    throw new Error("Nao foi possivel reagendar as buscas ativas.");
  }

  revalidatePath("/admin/clients");
}
