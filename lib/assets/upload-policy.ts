import { z } from "zod";

export const EXCLUSIVE_ASSET_LICENSE_TYPE = "exclusive";

const batchUploadMetadataSchema = z.object({
  description: z.string().trim().optional(),
  existingFolderId: z.string().trim().optional(),
  newFolderName: z.string().trim().optional(),
  newFolderDescription: z.string().trim().optional(),
});

export type AssetBatchMetadata = z.infer<typeof batchUploadMetadataSchema> & {
  licenseType: typeof EXCLUSIVE_ASSET_LICENSE_TYPE;
};

export type AssetBatchMetadataResult =
  | { success: true; data: AssetBatchMetadata }
  | { success: false; message: string };

function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export function parseAssetBatchMetadata(
  formData: FormData,
): AssetBatchMetadataResult {
  const parsed = batchUploadMetadataSchema.safeParse({
    description: getOptionalFormValue(formData, "description"),
    existingFolderId: getOptionalFormValue(formData, "existingFolderId"),
    newFolderName: getOptionalFormValue(formData, "newFolderName"),
    newFolderDescription: getOptionalFormValue(formData, "newFolderDescription"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  return {
    success: true,
    data: {
      ...parsed.data,
      licenseType: EXCLUSIVE_ASSET_LICENSE_TYPE,
    },
  };
}
