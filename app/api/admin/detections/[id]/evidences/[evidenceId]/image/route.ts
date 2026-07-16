import { getAdminDetectionEvidenceStorageKey } from "@/lib/dal/admin-evidences";
import { readEvidenceFromR2 } from "@/lib/r2";

export async function GET(
  _: Request,
  props: {
    params: Promise<{
      id: string;
      evidenceId: string;
    }>;
  },
) {
  const { id, evidenceId } = await props.params;
  const storageKey = await getAdminDetectionEvidenceStorageKey({
    detectionId: id,
    evidenceId,
  });
  const file = await readEvidenceFromR2(storageKey);

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
