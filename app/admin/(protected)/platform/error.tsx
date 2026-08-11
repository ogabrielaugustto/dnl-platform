"use client";

import { RouteError } from "@/components/app/route-error";

export default function AdminPlatformError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <RouteError area="Plataforma" {...props} />;
}
