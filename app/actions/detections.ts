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
  redirectTo: z.string().trim().min(1),
});

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
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    throw new Error("Nao foi possivel atualizar o status da ocorrencia.");
  }

  const { organizationId, userId } = await requireActiveOrganization();
  const supabase = await createClient();
  const { data: detection, error: detectionError } = await supabase
    .from("detections")
    .select("id, asset_id, status")
    .eq("organization_id", organizationId)
    .eq("id", parsed.data.detectionId)
    .maybeSingle();

  if (detectionError || !detection) {
    throw new Error("Ocorrencia nao encontrada para esta organizacao.");
  }

  if (detection.status === parsed.data.nextStatus) {
    revalidatePath("/detections");
    revalidatePath(`/detections/${detection.id}`);
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
    .eq("id", detection.id);

  if (updateError) {
    throw new Error("Nao foi possivel salvar a avaliacao desta ocorrencia.");
  }

  const { error: actionError } = await supabase.from("detection_actions").insert({
    organization_id: organizationId,
    detection_id: detection.id,
    user_id: userId,
    action: getActionLabel(parsed.data.nextStatus),
    from_status: detection.status,
    to_status: parsed.data.nextStatus,
    metadata: {},
  });

  if (actionError) {
    throw new Error("Nao foi possivel registrar o historico da ocorrencia.");
  }

  revalidatePath("/detections");
  revalidatePath(`/detections/${detection.id}`);
  revalidatePath(`/gallery/${detection.asset_id}`);
}
