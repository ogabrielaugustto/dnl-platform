"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
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
const RECENT_REFRESH_VISIBLE_MS = 4_000;

type LiveWorkflowRefreshProps = {
  organizationId: string;
  hasActiveWork: boolean;
};

export function LiveWorkflowRefresh({
  organizationId,
  hasActiveWork,
}: LiveWorkflowRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefreshReason, setLastRefreshReason] = useState<string | null>(null);
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
    function refresh(reason: string) {
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
        setLastRefreshReason(reason);
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
        () => refresh("realtime"),
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
          setLastRefreshReason("poll");
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

  useEffect(() => {
    if (!lastRefreshReason || hasActiveWork) {
      return;
    }

    const timeout = setTimeout(() => {
      setLastRefreshReason(null);
    }, RECENT_REFRESH_VISIBLE_MS);

    return () => clearTimeout(timeout);
  }, [hasActiveWork, lastRefreshReason]);

  if (!hasActiveWork && !isPending && !lastRefreshReason) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
      {hasActiveWork || isPending ? (
        <Spinner className="size-4 text-primary" />
      ) : (
        <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
      )}
      <span>
        {isPending
          ? "Atualizando acompanhamento..."
          : hasActiveWork
            ? "Acompanhando processamento. A tela atualiza quando o banco recebe novidades."
            : "Dados atualizados automaticamente."}
      </span>
    </div>
  );
}
