"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import {
  archiveAssetAction,
  type ArchiveAssetActionState,
} from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import type { AssetListItem } from "@/lib/dal/assets";
import { formatPublicId } from "@/lib/public-id";

const initialArchiveState: ArchiveAssetActionState = {};

function isProcessingAsset(asset: AssetListItem) {
  return (
    asset.statusSummary.kind === "pending" ||
    asset.statusSummary.kind === "processing"
  );
}

function DeleteMenuButton() {
  const { pending } = useFormStatus();

  return (
    <DropdownMenuItem asChild variant="destructive" disabled={pending}>
      <button type="submit" className="w-full">
        <Trash2Icon className="size-4" aria-hidden="true" />
        {pending ? "Apagando..." : "Apagar imagem"}
      </button>
    </DropdownMenuItem>
  );
}

function AssetMenu({ asset }: { asset: AssetListItem }) {
  const [state, action] = useActionState(
    archiveAssetAction,
    initialArchiveState,
  );
  const displayId = formatPublicId(asset.publicId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Abrir opcoes da imagem ${displayId}`}
          className="bg-black/45 text-white shadow-sm backdrop-blur hover:bg-black/60 hover:text-white"
          data-no-upload="true"
          onClick={(event) => event.stopPropagation()}
        >
          <EllipsisVerticalIcon className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        data-no-upload="true"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          data-no-upload="true"
          onClick={(event) => event.stopPropagation()}
          onSelect={() => {
            void navigator.clipboard.writeText(displayId);
          }}
        >
          <CopyIcon className="size-4" aria-hidden="true" />
          Copiar ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form
          action={action}
          data-no-upload="true"
          onClick={(event) => event.stopPropagation()}
          onSubmit={(event) => {
            if (!window.confirm("Apagar esta imagem da galeria?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="assetId" value={asset.id} />
          <DeleteMenuButton />
        </form>
        {state.message ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {state.message}
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AssetGalleryTile({
  asset,
  prioritizeImage = false,
}: {
  asset: AssetListItem;
  prioritizeImage?: boolean;
}) {
  const displayId = formatPublicId(asset.publicId);
  const isProcessing = isProcessingAsset(asset);

  return (
    <article
      data-gallery-tile="true"
      data-no-upload="true"
      onClick={(event) => event.stopPropagation()}
      className="group relative aspect-square overflow-hidden rounded-md bg-muted/40"
      title={`Imagem ${displayId}`}
    >
      {asset.primaryFile?.publicUrl ? (
        <Image
          src={asset.primaryFile.publicUrl}
          alt={asset.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 20vw, 16vw"
          loading={prioritizeImage ? "eager" : "lazy"}
          priority={prioritizeImage}
          className="object-cover transition duration-200 group-hover:scale-[1.015]"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Preview indisponivel
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/45 to-transparent opacity-90" />
      <div className="absolute right-2 top-2 z-10">
        <AssetMenu asset={asset} />
      </div>

      {isProcessing ? (
        <div className="absolute inset-x-2 bottom-2 z-10 flex items-center gap-2 rounded-md border border-white/15 bg-background/90 px-2.5 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          <Spinner className="size-3.5 text-primary" />
          <span className="truncate">{asset.statusSummary.label}</span>
        </div>
      ) : (
        <div className="absolute bottom-2 left-2 z-10 hidden items-center gap-1.5 rounded-md bg-black/45 px-2 py-1 text-xs font-medium text-white shadow-sm backdrop-blur group-hover:flex">
          <CheckIcon className="size-3.5" aria-hidden="true" />
          <span>{displayId}</span>
        </div>
      )}
    </article>
  );
}
