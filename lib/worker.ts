import "server-only";

import { env } from "@/lib/env.server";

export async function wakeWorkerForScanJob(scanJobId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.WORKER_BASE_URL.replace(/\/+$/, "")}/internal/jobs/${scanJobId}/run`,
      {
        method: "POST",
        headers: {
          "x-internal-secret": env.INTERNAL_API_SECRET,
        },
        cache: "no-store",
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}
