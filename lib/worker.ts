import "server-only";

import { env } from "@/lib/env.server";
import { buildWorkerInternalUrl } from "@/lib/worker-requests";

export async function wakeWorkerForScanJob(scanJobId: string): Promise<boolean> {
  try {
    const response = await fetch(buildWorkerInternalUrl(env.WORKER_BASE_URL, `/internal/jobs/${scanJobId}/run`), {
      method: "POST",
      headers: {
        "x-internal-secret": env.INTERNAL_API_SECRET,
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function wakeWorkerForSiteIntelInvestigation(detectionId: string): Promise<boolean> {
  try {
    const response = await fetch(
      buildWorkerInternalUrl(env.WORKER_BASE_URL, `/internal/site-intel/${detectionId}/run`),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": env.INTERNAL_API_SECRET,
        },
        body: JSON.stringify({ force: true }),
        cache: "no-store",
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}
