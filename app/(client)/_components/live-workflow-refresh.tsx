"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

const WATCHED_TABLES = [
  "assets",
  "asset_files",
  "monitoring_rules",
  "scan_jobs",
  "scan_runs",
  "detections",
  "detection_evidences",
] as const;

const ACTIVE_POLL_INTERVALS_MS = [8_000, 12_000, 20_000, 30_000] as const;
const REFRESH_DEBOUNCE_MS = 900;

type LiveWorkflowRefreshProps = {
  organizationId: string;
  hasActiveWork: boolean;
};

export function LiveWorkflowRefresh({
  organizationId,
  hasActiveWork,
}: LiveWorkflowRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityRef = useRef(
    typeof document === "undefined" ? "visible" : document.visibilityState,
  );

  useEffect(() => {
    function handleVisibilityChange() {
      visibilityRef.current = document.visibilityState;
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    function refresh() {
      if (visibilityRef.current !== "visible") {
        return;
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        startTransition(() => {
          router.refresh();
        });
      }, REFRESH_DEBOUNCE_MS);
    }

    const supabase = createClient();
    const channel = supabase.channel(`workflow:${organizationId}`);

    for (const table of WATCHED_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `organization_id=eq.${organizationId}`,
        },
        () => refresh(),
      );
    }

    channel.subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      supabase.removeChannel(channel);
    };
  }, [organizationId, router]);

  useEffect(() => {
    if (!hasActiveWork) {
      return;
    }

    let isCancelled = false;
    let attempt = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    function scheduleNextPoll() {
      if (isCancelled) {
        return;
      }

      const interval =
        ACTIVE_POLL_INTERVALS_MS[
          Math.min(attempt, ACTIVE_POLL_INTERVALS_MS.length - 1)
        ];

      timeout = setTimeout(() => {
        if (visibilityRef.current === "visible") {
          startTransition(() => {
            router.refresh();
          });
          attempt += 1;
        }

        scheduleNextPoll();
      }, interval);
    }

    scheduleNextPoll();

    return () => {
      isCancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [hasActiveWork, router]);

  return null;
}
