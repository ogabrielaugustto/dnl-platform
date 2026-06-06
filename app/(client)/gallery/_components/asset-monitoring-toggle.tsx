"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  toggleAssetMonitoringAction,
  type MonitoringToggleActionState,
} from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: MonitoringToggleActionState = {};

function MonitoringToggleButton({
  isActive,
  compact,
  floating,
}: {
  isActive: boolean;
  compact: boolean;
  floating: boolean;
}) {
  const { pending } = useFormStatus();
  const nextLabel = isActive ? "Desativar" : "Ativar";

  if (floating) {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label={`${nextLabel} monitoramento desta imagem`}
        aria-checked={isActive}
        role="switch"
        title={isActive ? "Monitoramento ativo" : "Monitoramento desativado"}
        className="inline-flex h-7 w-11 items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <span
          className={cn(
            "relative h-5 w-9 rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.22)] ring-1 ring-white/55 transition-colors",
            isActive
              ? "bg-emerald-500"
              : "bg-black/35 dark:bg-white/25",
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute left-0.5 top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-transform",
              isActive ? "translate-x-4" : "translate-x-0",
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <Button
      type="submit"
      variant={isActive ? "outline" : "secondary"}
      size={compact ? "sm" : "default"}
      disabled={pending}
      aria-label={`${nextLabel} monitoramento desta imagem`}
      aria-checked={isActive}
      role="switch"
      className={cn(
        "justify-between",
        compact ? "h-8 w-full px-2 text-xs" : "min-w-44",
      )}
    >
      <span className="truncate">{pending ? "Atualizando" : nextLabel}</span>
      <span
        className={cn(
          "relative h-4 w-7 rounded-full border transition-colors",
          isActive
            ? "border-primary bg-primary"
            : "border-border bg-muted-foreground/20",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute left-0.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-background shadow-sm transition-transform",
            isActive ? "translate-x-3.5" : "translate-x-0",
          )}
        />
      </span>
    </Button>
  );
}

export function AssetMonitoringToggle({
  assetId,
  isActive,
  compact = false,
  floating = false,
}: {
  assetId: string;
  isActive: boolean;
  compact?: boolean;
  floating?: boolean;
}) {
  const [state, action] = useActionState(toggleAssetMonitoringAction, initialState);

  return (
    <form action={action} className={floating ? "" : compact ? "w-full" : "space-y-2"}>
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="nextIsActive" value={String(!isActive)} />
      <MonitoringToggleButton
        isActive={isActive}
        compact={compact}
        floating={floating}
      />
      {state.message && !floating ? (
        <p
          className={cn(
            "text-xs",
            state.status === "error" ? "text-destructive" : "text-emerald-600",
            compact ? "mt-1" : "",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
