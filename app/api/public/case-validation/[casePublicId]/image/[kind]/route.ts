import { notFound } from "next/navigation";
import {
  getPublicCaseValidationImageRef,
  type PublicCaseValidationImageKind,
} from "@/lib/dal/case-public-validation";
import { readAssetFromR2, readEvidenceFromR2 } from "@/lib/r2";

const imageKinds = new Set<PublicCaseValidationImageKind>(["original", "matched"]);

function parseImageKind(value: string): PublicCaseValidationImageKind | null {
  return imageKinds.has(value as PublicCaseValidationImageKind)
    ? (value as PublicCaseValidationImageKind)
    : null;
}

export async function GET(
  request: Request,
  props: {
    params: Promise<{
      casePublicId: string;
      kind: string;
    }>;
  },
) {
  const { casePublicId: rawCasePublicId, kind: rawKind } = await props.params;
  const casePublicId = Number.parseInt(rawCasePublicId, 10);
  const kind = parseImageKind(rawKind);
  const validationCode = new URL(request.url).searchParams.get("chave") ?? "";

  if (!Number.isInteger(casePublicId) || casePublicId <= 0 || !kind) {
    notFound();
  }

  const imageRef = await getPublicCaseValidationImageRef({
    casePublicId,
    validationCode,
    kind,
  });

  if (!imageRef) {
    notFound();
  }

  const file =
    imageRef.bucket === "assets"
      ? await readAssetFromR2(imageRef.storageKey)
      : await readEvidenceFromR2(imageRef.storageKey);

  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
