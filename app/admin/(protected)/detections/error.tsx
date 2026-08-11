"use client";

import { RouteError } from "@/components/app/route-error";

export default function AdminDetectionsError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <RouteError area="Ocorrencias" {...props} />;
}
