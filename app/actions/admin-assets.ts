"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import { createClient } from "@/lib/server";

const archiveAdminAssetSchema = z.object({
  assetId: z.uuid(),
});

export type AdminArchiveAssetActionState = {
  message?: string;
  status?: "error" | "success";
};

export async function archiveAdminAssetAction(
  _: AdminArchiveAssetActionState,
  formData: FormData,
): Promise<AdminArchiveAssetActionState> {
  const parsed = archiveAdminAssetSchema.safeParse({
    assetId: formData.get("assetId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    await requirePanelAccess("admin");
    const supabase = await createClient();
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, organization_id")
      .eq("id", parsed.data.assetId)
      .is("archived_at", null)
      .maybeSingle<{ id: string; organization_id: string }>();

    if (assetError || !asset) {
      throw new Error("Imagem nao encontrada.");
    }

    const archivedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("assets")
      .update({
        status: "archived",
        archived_at: archivedAt,
      })
      .eq("id", parsed.data.assetId);

    if (updateError) {
      throw new Error("Nao foi possivel remover esta imagem agora.");
    }

    await supabase
      .from("monitoring_rules")
      .update({
        is_active: false,
        next_run_at: null,
        archived_at: archivedAt,
      })
      .eq("asset_id", parsed.data.assetId)
      .is("archived_at", null);

    revalidatePath("/admin/assets");
    revalidatePath("/admin/detections");
    revalidatePath("/admin/cases");
    revalidatePath("/gallery");
    revalidatePath("/detections");

    return {
      status: "success",
      message: "Imagem removida da galeria.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel remover esta imagem agora.",
    };
  }
}
