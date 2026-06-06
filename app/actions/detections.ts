"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveOrganization } from "@/lib/dal/assets";
import { createClient } from "@/lib/server";

const updateDetectionStatusSchema = z.object({
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

export async function updateDetectionStatusAction(formData: FormData) {
  const parsed = updateDetectionStatusSchema.safeParse({
    detectionId: formData.get("detectionId"),
    nextStatus: formData.get("nextStatus"),
    scope: formData.get("scope") ?? "single",
    reason: formData.get("reason") ?? undefined,
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    throw new Error("Nao foi possivel atualizar o status da ocorrencia.");
  }

  const { organizationId, userId } = await requireActiveOrganization();
  const supabase = await createClient();
  const { data: detection, error: detectionError } = await supabase
    .from("detections")
    .select("id, asset_id, source_url, canonical_source_url, domain, status")
    .eq("organization_id", organizationId)
    .eq("id", parsed.data.detectionId)
    .maybeSingle();

  if (detectionError || !detection) {
    throw new Error("Ocorrencia nao encontrada para esta organizacao.");
  }

  const representative = detection as DetectionActionRow;
  let targetDetections = [representative];

  if (parsed.data.scope === "incident") {
    const representativeDomain = parseNormalizedDomain(representative);
    const { data: siblingDetections, error: siblingError } = await supabase
      .from("detections")
      .select("id, asset_id, source_url, canonical_source_url, domain, status")
      .eq("organization_id", organizationId)
      .eq("asset_id", representative.asset_id)
      .is("archived_at", null);

    if (siblingError) {
      throw new Error("Nao foi possivel carregar o grupo desta ocorrencia.");
    }

    targetDetections = ((siblingDetections ?? []) as DetectionActionRow[]).filter(
      (item) => parseNormalizedDomain(item) === representativeDomain,
    );
  }

  const detectionsToUpdate = targetDetections.filter(
    (item) => item.status !== parsed.data.nextStatus,
  );

  if (detectionsToUpdate.length === 0) {
    revalidatePath("/detections");
    revalidatePath(`/detections/${representative.id}`);
    revalidatePath("/cases");
    return;
  }

  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("detections")
    .update({
      status: parsed.data.nextStatus,
      reviewed_at: reviewedAt,
      reviewed_by_user_id: userId,
    })
    .eq("organization_id", organizationId)
    .in(
      "id",
      detectionsToUpdate.map((item) => item.id),
    );

  if (updateError) {
    throw new Error("Nao foi possivel salvar a avaliacao desta ocorrencia.");
  }

  const actionRows = detectionsToUpdate.map((item) => ({
    organization_id: organizationId,
    detection_id: item.id,
    user_id: userId,
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

  revalidatePath("/detections");
  revalidatePath("/cases");
  revalidatePath(`/detections/${representative.id}`);
  revalidatePath("/gallery");
}
