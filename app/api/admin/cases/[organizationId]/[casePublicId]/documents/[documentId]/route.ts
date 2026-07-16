import { notFound } from "next/navigation";
import { getAdminCaseDocumentStorageKey } from "@/lib/dal/admin-cases";
import { readCaseDocumentFromR2 } from "@/lib/r2";

type AdminCaseDocumentRouteProps = {
  params: Promise<{
    organizationId: string;
    casePublicId: string;
    documentId: string;
  }>;
};

export async function GET(_: Request, props: AdminCaseDocumentRouteProps) {
  const params = await props.params;
  const casePublicId = Number.parseInt(params.casePublicId, 10);

  if (Number.isNaN(casePublicId)) {
    notFound();
  }

  const document = await getAdminCaseDocumentStorageKey({
    organizationId: params.organizationId,
    casePublicId,
    documentId: params.documentId,
  });

  if (!document) {
    notFound();
  }

  const file = await readCaseDocumentFromR2(document.storageKey);

  return new Response(file.body, {
    headers: {
      "content-type": document.mimeType || file.contentType,
      "content-disposition": `inline; filename="${document.fileName.replaceAll('"', "")}"`,
    },
  });
}
