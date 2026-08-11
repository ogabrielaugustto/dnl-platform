"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import { createClient } from "@/lib/server";
import { wakeWorkerForSiteIntelInvestigation } from "@/lib/worker";

const updateAdminDetectionStatusSchema = z.object({
  detectionId: z.uuid(),
  nextStatus: z.enum([
    "pending",
    "possible_infringement",
    "authorized",
    "unauthorized",
    "takedown_sent",
    "resolved",
    "ignored",
  ]),
  scope: z.enum(["single", "incident"]).default("single"),
  reason: z.string().trim().max(120).optional(),
  redirectTo: z.string().trim().min(1),
});

type DetectionActionRow = {
  id: string;
  case_public_id: number;
  organization_id: string;
  asset_id: string;
  source_url: string;
  canonical_source_url: string;
  domain: string | null;
  status: string;
};

function parseNormalizedDomain(params: {
  domain: string | null;
  source_url: string;
  canonical_source_url: string;
}) {
  const candidates = [params.domain, params.source_url, params.canonical_source_url];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const host = candidate.includes("://") ? new URL(candidate).hostname : candidate;
      const normalized = host.trim().toLowerCase().replace(/^www\./, "");

      if (normalized) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  return "site-nao-identificado";
}

function getActionLabel(nextStatus: string) {
  switch (nextStatus) {
    case "possible_infringement":
      return "marcada_como_possivel_infracao";
    case "authorized":
      return "marcada_como_uso_autorizado";
    case "unauthorized":
      return "marcada_como_uso_nao_autorizado";
    case "takedown_sent":
      return "notificacao_enviada";
    case "resolved":
      return "marcada_como_resolvida";
    case "ignored":
      return "marcada_como_ignorada";
    default:
      return "status_atualizado";
  }
}

export async function updateAdminDetectionStatusAction(formData: FormData) {
  const parsed = updateAdminDetectionStatusSchema.safeParse({
    detectionId: formData.get("detectionId"),
    nextStatus: formData.get("nextStatus"),
    scope: formData.get("scope") ?? "single",
    reason: formData.get("reason") ?? undefined,
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    throw new Error("Nao foi possivel atualizar o status da ocorrencia.");
  }

  const context = await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data: detection, error: detectionError } = await supabase
    .from("detections")
    .select("id, case_public_id, organization_id, asset_id, source_url, canonical_source_url, domain, status")
    .eq("id", parsed.data.detectionId)
    .maybeSingle<DetectionActionRow>();

  if (detectionError || !detection) {
    throw new Error("Ocorrencia nao encontrada.");
  }

  const representative = detection;
  let targetDetections = [representative];

  if (parsed.data.scope === "incident") {
    const representativeDomain = parseNormalizedDomain(representative);
    const { data: siblingDetections, error: siblingError } = await supabase
      .from("detections")
      .select("id, organization_id, asset_id, source_url, canonical_source_url, domain, status")
      .eq("organization_id", representative.organization_id)
      .eq("asset_id", representative.asset_id)
      .is("archived_at", null)
      .returns<DetectionActionRow[]>();

    if (siblingError) {
      throw new Error("Nao foi possivel carregar o grupo desta ocorrencia.");
    }

    targetDetections = (siblingDetections ?? []).filter(
      (item) => parseNormalizedDomain(item) === representativeDomain,
    );
  }

  const detectionsToUpdate = targetDetections.filter(
    (item) => item.status !== parsed.data.nextStatus,
  );

  if (detectionsToUpdate.length === 0) {
    revalidatePath("/admin/detections");
    revalidatePath(parsed.data.redirectTo);
    revalidatePath("/cases");
    revalidatePath(`/cases/${representative.case_public_id}`);
    return;
  }

  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("detections")
    .update({
      status: parsed.data.nextStatus,
      reviewed_at: reviewedAt,
      reviewed_by_user_id: context.userId,
    })
    .eq("organization_id", representative.organization_id)
    .in(
      "id",
      detectionsToUpdate.map((item) => item.id),
    );

  if (updateError) {
    throw new Error("Nao foi possivel salvar a avaliacao desta ocorrencia.");
  }

  const actionRows = detectionsToUpdate.map((item) => ({
    organization_id: representative.organization_id,
    detection_id: item.id,
    user_id: context.userId,
    action: getActionLabel(parsed.data.nextStatus),
    from_status: item.status,
    to_status: parsed.data.nextStatus,
    metadata: {
      scope: parsed.data.scope,
      representativeDetectionId: representative.id,
      reason: parsed.data.reason ?? null,
    },
  }));

  const { error: actionError } = await supabase.from("detection_actions").insert(actionRows);

  if (actionError) {
    throw new Error("Nao foi possivel registrar o historico da ocorrencia.");
  }

  if (parsed.data.nextStatus === "unauthorized") {
    await Promise.allSettled(
      detectionsToUpdate.map((item) => wakeWorkerForSiteIntelInvestigation(item.id)),
    );
  }

  revalidatePath("/admin/detections");
  revalidatePath(parsed.data.redirectTo);
  revalidatePath("/admin/cases");
  revalidatePath("/gallery");
  revalidatePath("/detections");
  revalidatePath("/cases");
  revalidatePath(`/cases/${representative.case_public_id}`);
}
