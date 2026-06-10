"use client";

import { useTransition, type ComponentProps } from "react";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RefreshDataButtonProps = {
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
};

export function RefreshDataButton({
  label = "Atualizar",
  size = "default",
}: RefreshDataButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      <RefreshCwIcon
        className={isPending ? "animate-spin" : undefined}
        aria-hidden="true"
      />
      {isPending ? "Atualizando" : label}
    </Button>
  );
}
