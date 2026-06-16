"use client";

import { RouteError } from "@/components/app/route-error";

export default function AdminUsersError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return <RouteError area="Usuarios" {...props} />;
}
