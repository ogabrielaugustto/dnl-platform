export function buildAdminEvidenceImageUrl(detectionId: string, evidenceId: string) {
  return `/api/admin/detections/${detectionId}/evidences/${evidenceId}/image`;
}

export function buildAdminEvidenceMatchedImageUrl(detectionId: string, evidenceId: string) {
  return `/api/admin/detections/${detectionId}/evidences/${evidenceId}/matched-image`;
}
