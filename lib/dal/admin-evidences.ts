import "server-only";

import { notFound } from "next/navigation";
import { requirePanelAccess } from "@/lib/auth";
import { createClient } from "@/lib/server";

export async function getAdminDetectionEvidenceStorageKey(params: {
  detectionId: string;
  evidenceId: string;
}) {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detection_evidences")
    .select("id, detection_id, screenshot_storage_key")
    .eq("detection_id", params.detectionId)
    .eq("id", params.evidenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Nao foi possivel acessar a evidencia.");
  }

  if (!data?.screenshot_storage_key) {
    notFound();
  }

  return data.screenshot_storage_key;
}

export async function getAdminDetectionMatchedImageStorageKey(params: {
  detectionId: string;
  evidenceId: string;
}) {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detection_evidences")
    .select("id, detection_id, matched_image_storage_key")
    .eq("detection_id", params.detectionId)
    .eq("id", params.evidenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Nao foi possivel acessar a imagem encontrada.");
  }

  if (!data?.matched_image_storage_key) {
    notFound();
  }

  return data.matched_image_storage_key;
}
