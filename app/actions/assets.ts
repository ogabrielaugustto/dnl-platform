"use server";

import { revalidatePath, refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assetLicenseOptions } from "@/lib/asset-license";
import {
  buildManualScanDedupeKey,
  getDefaultNextRunAt,
  getOrganizationMonitoringFrequency,
  requireWritableOrganization,
  type MonitoringRuleFrequency,
} from "@/lib/dal/assets";
import { buildAssetPublicUrl, deleteAssetFromR2, uploadAssetToR2 } from "@/lib/r2";
import { createClient } from "@/lib/server";
import { wakeWorkerForScanJob } from "@/lib/worker";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 30;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const assetLicenseValues = assetLicenseOptions.map((option) => option.value);

const batchUploadSchema = z.object({
  description: z.string().trim().optional(),
  licenseType: z.enum(assetLicenseValues as [string, ...string[]], {
    error: "Selecione um tipo de licenca valido.",
  }),
  existingFolderId: z.string().trim().optional(),
  newFolderName: z.string().trim().optional(),
  newFolderDescription: z.string().trim().optional(),
});

const createFolderSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  description: z.string().trim().optional(),
});

const renameAssetSchema = z.object({
  assetId: z.uuid(),
  title: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(120, "Use no maximo 120 caracteres para o nome da imagem."),
});

const renameFolderSchema = z.object({
  folderId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(120, "Use no maximo 120 caracteres para o nome da pasta."),
});

const toggleMonitoringSchema = z.object({
  assetId: z.uuid(),
  nextIsActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const archiveAssetSchema = z.object({
  assetId: z.uuid(),
});

export type AssetBatchActionState = {
  message?: string;
  status?: "error";
};

export type FolderActionState = {
  message?: string;
  status?: "error" | "success";
};

export type RenameActionState = FolderActionState;

export type MonitoringToggleActionState = {
  message?: string;
  status?: "error" | "success";
};

export type ArchiveAssetActionState = MonitoringToggleActionState;

type BatchProcessingResult = {
  createdCount: number;
  queuedCount: number;
  pendingWorkerCount: number;
  failedCount: number;
};

function isMissingFolderSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42P01" ||
    candidate.code === "42703" ||
    combinedMessage.includes("asset_folders") ||
    combinedMessage.includes("folder_id")
  );
}

function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { code?: string }).code === "23505";
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "asset-image";
}

function getAssetTitleFromFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").trim();

  return normalized.length > 0 ? normalized : "Imagem monitorada";
}

function buildAssetStorageKey(params: {
  organizationId: string;
  assetId: string;
  assetFileId: string;
  fileName: string;
}) {
  return `organizations/${params.organizationId}/assets/${params.assetId}/${params.assetFileId}-${sanitizeFileName(params.fileName)}`;
}

function buildRenamedFileName(title: string, originalFileName: string | null) {
  const extension = originalFileName?.match(/(\.[^./\\]+)$/)?.[1] ?? "";
  return `${title}${extension}`;
}

function encodeRedirectParams(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `${pathname}?${searchParams.toString()}`;
}

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

async function ensureFolderId(params: {
  organizationId: string;
  userId: string;
  existingFolderId?: string;
  newFolderName?: string;
  newFolderDescription?: string;
}) {
  const supabase = await createClient();

  if (params.newFolderName && params.newFolderName.length > 0) {
    const { data, error } = await supabase
      .from("asset_folders")
      .insert({
        organization_id: params.organizationId,
        name: params.newFolderName,
        description: params.newFolderDescription || null,
        created_by_user_id: params.userId,
      })
      .select("id")
      .single();

    if (error && isMissingFolderSchemaError(error)) {
      throw new Error(
        "As pastas ainda nao estao disponiveis neste ambiente. Aplique a migration compartilhada primeiro.",
      );
    }

    if (error || !data) {
      throw new Error("Nao foi possivel criar a nova pasta para este lote.");
    }

    return (data as { id: string }).id;
  }

  if (params.existingFolderId && params.existingFolderId.length > 0) {
    const { data, error } = await supabase
      .from("asset_folders")
      .select("id")
      .eq("organization_id", params.organizationId)
      .eq("id", params.existingFolderId)
      .maybeSingle();

    if (error && isMissingFolderSchemaError(error)) {
      throw new Error(
        "As pastas ainda nao estao disponiveis neste ambiente. Aplique a migration compartilhada primeiro.",
      );
    }

    if (error || !data) {
      throw new Error("A pasta selecionada nao pertence a esta organizacao.");
    }

    return (data as { id: string }).id;
  }

  return null;
}

async function createSingleAssetFromFile(params: {
  organizationId: string;
  userId: string;
  file: File;
  description: string | undefined;
  licenseType: string;
  frequency: MonitoringRuleFrequency;
  folderId: string | null;
}) {
  const supabase = await createClient();
  const assetTitle = getAssetTitleFromFileName(params.file.name);

  let assetId: string | null = null;
  let storageKey: string | null = null;

  try {
    const baseAssetInsert = {
      organization_id: params.organizationId,
      title: assetTitle,
      description: params.description || null,
      author: null,
      license_type: params.licenseType,
      status: "active",
    };
    let { data: assetData, error: assetError } = await supabase
      .from("assets")
      .insert({
        ...baseAssetInsert,
        folder_id: params.folderId,
      })
      .select("id")
      .single();

    if (assetError && isMissingFolderSchemaError(assetError)) {
      const fallback = await supabase
        .from("assets")
        .insert(baseAssetInsert)
        .select("id")
        .single();

      assetData = fallback.data;
      assetError = fallback.error;
    }

    const asset = assetData as { id: string } | null;

    if (assetError || !asset) {
      throw new Error("Nao foi possivel criar o asset.");
    }

    assetId = asset.id;

    const { data: assetFileData, error: assetFileError } = await supabase
      .from("asset_files")
      .insert({
        organization_id: params.organizationId,
        asset_id: assetId,
        storage_provider: "r2",
        is_primary: true,
      })
      .select("id")
      .single();
    const assetFile = assetFileData as { id: string } | null;

    if (assetFileError || !assetFile) {
      throw new Error("Nao foi possivel reservar o arquivo principal.");
    }

    storageKey = buildAssetStorageKey({
      organizationId: params.organizationId,
      assetId,
      assetFileId: assetFile.id,
      fileName: params.file.name,
    });

    await uploadAssetToR2({
      key: storageKey,
      body: Buffer.from(await params.file.arrayBuffer()),
      contentType: params.file.type,
    });

    const { error: updateFileError } = await supabase
      .from("asset_files")
      .update({
        storage_key: storageKey,
        public_url: buildAssetPublicUrl(storageKey),
        original_file_name: params.file.name,
        mime_type: params.file.type,
        size_bytes: params.file.size,
      })
      .eq("id", assetFile.id)
      .eq("organization_id", params.organizationId);

    if (updateFileError) {
      throw new Error("Nao foi possivel finalizar o arquivo principal.");
    }

    const { data: monitoringRuleData, error: monitoringRuleError } = await supabase
      .from("monitoring_rules")
      .insert({
        organization_id: params.organizationId,
        asset_id: assetId,
        name: `Monitoramento - ${assetTitle}`,
        frequency: params.frequency,
        is_active: true,
        next_run_at: getDefaultNextRunAt(params.frequency),
        created_by_user_id: params.userId,
      })
      .select("id")
      .single();
    const monitoringRule = monitoringRuleData as { id: string } | null;

    if (monitoringRuleError || !monitoringRule) {
      throw new Error("Nao foi possivel criar a regra inicial de monitoramento.");
    }

    const { data: scanJobData, error: scanJobError } = await supabase
      .from("scan_jobs")
      .insert({
        organization_id: params.organizationId,
        asset_id: assetId,
        monitoring_rule_id: monitoringRule.id,
        requested_by_user_id: params.userId,
        type: "manual_scan",
        status: "pending",
        priority: 100,
        dedupe_key: buildManualScanDedupeKey(assetId),
      })
      .select("id")
      .single();
    const scanJob = scanJobData as { id: string } | null;

    if (scanJobError || !scanJob) {
      throw new Error("Nao foi possivel iniciar a primeira busca.");
    }

    const workerTriggered = await wakeWorkerForScanJob(scanJob.id);

    return {
      assetId,
      workerTriggered,
    };
  } catch (error) {
    if (assetId) {
      if (storageKey) {
        try {
          await deleteAssetFromR2(storageKey);
        } catch {
          // Keep the original error and allow cleanup to be best-effort.
        }
      }

      await supabase.from("assets").delete().eq("id", assetId);
    }

    throw error;
  }
}

function buildBatchSummaryMessage(params: {
  uploadedCount: number;
  createdCount: number;
  queuedCount: number;
  pendingWorkerCount: number;
  failedCount: number;
}) {
  return encodeRedirectParams("/gallery", {
    uploaded: String(params.uploadedCount),
    created: String(params.createdCount),
    queued: String(params.queuedCount),
    pending: String(params.pendingWorkerCount),
    failed: String(params.failedCount),
  });
}

export async function createAssetBatchAction(
  _: AssetBatchActionState,
  formData: FormData,
): Promise<AssetBatchActionState> {
  const parsed = batchUploadSchema.safeParse({
    description: getOptionalFormValue(formData, "description"),
    licenseType: getOptionalFormValue(formData, "licenseType"),
    existingFolderId: getOptionalFormValue(formData, "existingFolderId"),
    newFolderName: getOptionalFormValue(formData, "newFolderName"),
    newFolderDescription: getOptionalFormValue(formData, "newFolderDescription"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return {
      status: "error",
      message: "Selecione pelo menos uma imagem para importar.",
    };
  }

  if (files.length > MAX_FILES_PER_BATCH) {
    return {
      status: "error",
      message: `Envie no maximo ${MAX_FILES_PER_BATCH} imagens por lote nesta primeira versao.`,
    };
  }

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return {
        status: "error",
        message: `O arquivo ${file.name} nao possui um formato de imagem aceito.`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        status: "error",
        message: `O arquivo ${file.name} excede o limite de 10 MB.`,
      };
    }
  }

  let redirectPath: string | null = null;

  try {
    const { organizationId, userId } = await requireWritableOrganization();
    const frequency = await getOrganizationMonitoringFrequency(organizationId);
    const folderId = await ensureFolderId({
      organizationId,
      userId,
      existingFolderId: parsed.data.existingFolderId,
      newFolderName: parsed.data.newFolderName,
      newFolderDescription: parsed.data.newFolderDescription,
    });

    const result: BatchProcessingResult = {
      createdCount: 0,
      queuedCount: 0,
      pendingWorkerCount: 0,
      failedCount: 0,
    };

    for (const file of files) {
      try {
        const created = await createSingleAssetFromFile({
          organizationId,
          userId,
          file,
          description: parsed.data.description,
          licenseType: parsed.data.licenseType,
          frequency,
          folderId,
        });

        result.createdCount += 1;
        if (created.workerTriggered) {
          result.queuedCount += 1;
        } else {
          result.pendingWorkerCount += 1;
        }
      } catch {
        result.failedCount += 1;
      }
    }

    if (result.createdCount === 0) {
      return {
        status: "error",
        message: "Nao foi possivel importar nenhuma imagem deste lote.",
      };
    }

    redirectPath = buildBatchSummaryMessage({
      uploadedCount: files.length,
      createdCount: result.createdCount,
      queuedCount: result.queuedCount,
      pendingWorkerCount: result.pendingWorkerCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel importar este lote agora.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    status: "error",
    message: "Nao foi possivel concluir a importacao deste lote.",
  };
}

export async function createAssetFolderAction(
  _: FolderActionState,
  formData: FormData,
): Promise<FolderActionState> {
  const parsed = createFolderSchema.safeParse({
    name: getOptionalFormValue(formData, "name"),
    description: getOptionalFormValue(formData, "description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    const { organizationId, userId } = await requireWritableOrganization();
    const supabase = await createClient();
    const { error } = await supabase.from("asset_folders").insert({
      organization_id: organizationId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      created_by_user_id: userId,
    });

    if (error) {
      throw new Error("Nao foi possivel criar a pasta agora.");
    }

    refresh();

    return {
      status: "success",
      message: "Pasta criada com sucesso.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel criar a pasta agora.",
    };
  }
}

export async function renameAssetAction(
  _: RenameActionState,
  formData: FormData,
): Promise<RenameActionState> {
  const parsed = renameAssetSchema.safeParse({
    assetId: formData.get("assetId"),
    title: getOptionalFormValue(formData, "title"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    const { organizationId } = await requireWritableOrganization();
    const supabase = await createClient();
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", parsed.data.assetId)
      .maybeSingle();

    if (assetError || !asset) {
      throw new Error("Imagem nao encontrada para esta organizacao.");
    }

    const { error: updateAssetError } = await supabase
      .from("assets")
      .update({
        title: parsed.data.title,
      })
      .eq("organization_id", organizationId)
      .eq("id", parsed.data.assetId);

    if (updateAssetError) {
      throw new Error("Nao foi possivel renomear esta imagem agora.");
    }

    await supabase
      .from("monitoring_rules")
      .update({
        name: `Monitoramento - ${parsed.data.title}`,
      })
      .eq("organization_id", organizationId)
      .eq("asset_id", parsed.data.assetId);

    const { data: primaryFile } = await supabase
      .from("asset_files")
      .select("id, original_file_name")
      .eq("organization_id", organizationId)
      .eq("asset_id", parsed.data.assetId)
      .eq("is_primary", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (primaryFile?.id) {
      const { error: updatePrimaryFileError } = await supabase
        .from("asset_files")
        .update({
          original_file_name: buildRenamedFileName(
            parsed.data.title,
            primaryFile.original_file_name,
          ),
        })
        .eq("organization_id", organizationId)
        .eq("id", primaryFile.id);

      if (updatePrimaryFileError) {
        throw new Error("A imagem foi renomeada, mas o nome do arquivo nao foi atualizado.");
      }
    }

    revalidatePath("/gallery");
    revalidatePath("/detections");
    refresh();

    return {
      status: "success",
      message: "Nome da imagem atualizado com sucesso.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel renomear esta imagem agora.",
    };
  }
}

export async function renameAssetFolderAction(
  _: RenameActionState,
  formData: FormData,
): Promise<RenameActionState> {
  const parsed = renameFolderSchema.safeParse({
    folderId: formData.get("folderId"),
    name: getOptionalFormValue(formData, "name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    const { organizationId } = await requireWritableOrganization();
    const supabase = await createClient();
    const { data: folder, error: folderError } = await supabase
      .from("asset_folders")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", parsed.data.folderId)
      .maybeSingle();

    if (folderError || !folder) {
      throw new Error("Pasta nao encontrada para esta organizacao.");
    }

    const { error } = await supabase
      .from("asset_folders")
      .update({
        name: parsed.data.name,
      })
      .eq("organization_id", organizationId)
      .eq("id", parsed.data.folderId);

    if (error && isUniqueConstraintError(error)) {
      throw new Error("Ja existe uma pasta com este nome na sua organizacao.");
    }

    if (error) {
      throw new Error("Nao foi possivel renomear esta pasta agora.");
    }

    revalidatePath("/gallery");
    refresh();

    return {
      status: "success",
      message: "Nome da pasta atualizado com sucesso.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel renomear esta pasta agora.",
    };
  }
}

export async function triggerAssetScanAction(formData: FormData) {
  const assetId = formData.get("assetId");
  const redirectTo = formData.get("redirectTo");

  if (typeof assetId !== "string" || assetId.length === 0) {
    return;
  }

  if (typeof redirectTo !== "string" || redirectTo.length === 0) {
    return;
  }

  const { organizationId, userId } = await requireWritableOrganization();
  const supabase = await createClient();
  const { data: assetData, error: assetError } = await supabase
    .from("assets")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", assetId)
    .maybeSingle();
  const asset = assetData as { id: string } | null;

  if (assetError || !asset) {
    throw new Error("Asset nao encontrado para esta organizacao.");
  }

  const { data: monitoringRuleData } = await supabase
    .from("monitoring_rules")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const monitoringRule = monitoringRuleData as { id: string } | null;

  const { data: scanJobData, error: scanJobError } = await supabase
    .from("scan_jobs")
    .insert({
      organization_id: organizationId,
      asset_id: assetId,
      monitoring_rule_id: monitoringRule?.id ?? null,
      requested_by_user_id: userId,
      type: "manual_scan",
      status: "pending",
      priority: 100,
      dedupe_key: buildManualScanDedupeKey(assetId),
    })
    .select("id")
    .single();
  const scanJob = scanJobData as { id: string } | null;

  if (scanJobError || !scanJob) {
    throw new Error("Nao foi possivel iniciar uma nova busca agora.");
  }

  const workerTriggered = await wakeWorkerForScanJob(scanJob.id);

  redirect(
    encodeRedirectParams(redirectTo, {
      scan: "1",
      worker: workerTriggered ? "queued" : "pending",
    }),
  );
}

export async function toggleAssetMonitoringAction(
  _: MonitoringToggleActionState,
  formData: FormData,
): Promise<MonitoringToggleActionState> {
  const parsed = toggleMonitoringSchema.safeParse({
    assetId: formData.get("assetId"),
    nextIsActive: formData.get("nextIsActive"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    const { organizationId, userId } = await requireWritableOrganization();
    const supabase = await createClient();
    const { data: assetData, error: assetError } = await supabase
      .from("assets")
      .select("id, title")
      .eq("organization_id", organizationId)
      .eq("id", parsed.data.assetId)
      .is("archived_at", null)
      .maybeSingle();
    const asset = assetData as { id: string; title: string } | null;

    if (assetError || !asset) {
      throw new Error("Imagem nao encontrada para esta organizacao.");
    }

    const { data: monitoringRuleData, error: monitoringRuleError } = await supabase
      .from("monitoring_rules")
      .select("id, frequency")
      .eq("organization_id", organizationId)
      .eq("asset_id", parsed.data.assetId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const monitoringRule = monitoringRuleData as {
      id: string;
      frequency: MonitoringRuleFrequency;
    } | null;

    if (monitoringRuleError) {
      throw new Error("Nao foi possivel localizar a regra de monitoramento.");
    }

    if (monitoringRule) {
      const nextRunAt = parsed.data.nextIsActive
        ? getDefaultNextRunAt(monitoringRule.frequency)
        : null;
      const { error: updateError } = await supabase
        .from("monitoring_rules")
        .update({
          is_active: parsed.data.nextIsActive,
          next_run_at: nextRunAt,
        })
        .eq("organization_id", organizationId)
        .eq("id", monitoringRule.id);

      if (updateError) {
        throw new Error("Nao foi possivel atualizar o monitoramento agora.");
      }
    } else {
      if (!parsed.data.nextIsActive) {
        return {
          status: "success",
          message: "Esta imagem ja estava sem monitoramento automatico.",
        };
      }

      const frequency = await getOrganizationMonitoringFrequency(organizationId);
      const { error: insertError } = await supabase.from("monitoring_rules").insert({
        organization_id: organizationId,
        asset_id: parsed.data.assetId,
        name: `Monitoramento - ${asset.title}`,
        frequency,
        is_active: true,
        next_run_at: getDefaultNextRunAt(frequency),
        created_by_user_id: userId,
      });

      if (insertError) {
        throw new Error("Nao foi possivel ativar o monitoramento agora.");
      }
    }

    revalidatePath("/gallery");
    refresh();

    return {
      status: "success",
      message: parsed.data.nextIsActive
        ? "Monitoramento ativado."
        : "Monitoramento desativado.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o monitoramento agora.",
    };
  }
}

export async function archiveAssetAction(
  _: ArchiveAssetActionState,
  formData: FormData,
): Promise<ArchiveAssetActionState> {
  const parsed = archiveAssetSchema.safeParse({
    assetId: formData.get("assetId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    const { organizationId } = await requireWritableOrganization();
    const supabase = await createClient();
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", parsed.data.assetId)
      .is("archived_at", null)
      .maybeSingle();

    if (assetError || !asset) {
      throw new Error("Imagem nao encontrada para esta organizacao.");
    }

    const archivedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("assets")
      .update({
        status: "archived",
        archived_at: archivedAt,
      })
      .eq("organization_id", organizationId)
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
      .eq("organization_id", organizationId)
      .eq("asset_id", parsed.data.assetId)
      .is("archived_at", null);

    revalidatePath("/gallery");
    revalidatePath("/detections");
    refresh();

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
