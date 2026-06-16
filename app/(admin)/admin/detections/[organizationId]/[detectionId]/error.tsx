"use client";

import { RouteError } from "@/components/app/route-error";

export default function AdminDetectionDetailsError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <RouteError area="Detalhe da ocorrencia" {...props} />;
}
