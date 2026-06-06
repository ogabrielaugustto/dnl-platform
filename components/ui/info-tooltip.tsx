"use client";

import { CircleHelpIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTooltip({
  content,
  label = "Mais informacoes",
}: {
  content: string;
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-4 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <CircleHelpIcon className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{content}</TooltipContent>
    </Tooltip>
  );
}
