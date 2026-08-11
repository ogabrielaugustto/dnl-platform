"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import { useActionState } from "react";
import {
  FolderPlusIcon,
  ImagePlusIcon,
  ImagesIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAssetBatchAction,
  type AssetBatchActionState,
} from "@/app/actions/assets";
import { ClientRepresentationRequiredDialog } from "@/app/(client)/(panel)/gallery/_components/client-representation-required-dialog";
import { AssetFolderFilter } from "@/app/(client)/(panel)/gallery/_components/asset-folder-filter";
import { AssetFolderForm } from "@/app/(client)/(panel)/gallery/_components/asset-folder-form";
import { AssetGalleryTile } from "@/app/(client)/(panel)/gallery/_components/asset-gallery-tile";
import { RenameFolderForm } from "@/app/(client)/(panel)/gallery/_components/rename-folder-form";
import { RefreshDataButton } from "@/components/app/refresh-data-button";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  ClientRepresentationDefaults,
  ClientRepresentationUploadGate,
} from "@/lib/dal/client-representation-documents";
import type { AssetFolderListItem, AssetListItem } from "@/lib/dal/assets";
import { cn } from "@/lib/utils";

const initialState: AssetBatchActionState = {};
const FLASH_SEARCH_PARAMS = [
  "uploaded",
  "created",
  "queued",
  "pending",
  "failed",
  "scan",
  "worker",
] as const;

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

function buildFileId(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

function pluralizeImages(count: number) {
  return count === 1 ? "1 imagem" : `${count} imagens`;
}

function PendingSubmitButton({
  formId,
  disabled,
  pending,
}: {
  formId: string;
  disabled: boolean;
  pending: boolean;
}) {
  return (
    <Button type="submit" form={formId} disabled={pending || disabled}>
      <UploadCloudIcon className="size-4" aria-hidden="true" />
      {pending ? "Enviando..." : "Confirmar envio"}
    </Button>
  );
}

function PendingPreviewTile({
  entry,
  onRemove,
}: {
  entry: SelectedFile;
  onRemove: (id: string) => void;
}) {
  return (
    <article
      data-gallery-tile="true"
      data-no-upload="true"
      onClick={(event) => event.stopPropagation()}
      className="group relative aspect-square overflow-hidden rounded-md bg-muted/40 ring-1 ring-primary/25"
    >
      <img
        src={entry.previewUrl}
        alt={entry.file.name}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/45 to-transparent" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remover ${entry.file.name} da selecao`}
        className="absolute right-2 top-2 z-10 bg-black/45 text-white shadow-sm backdrop-blur hover:bg-black/60 hover:text-white"
        onClick={() => onRemove(entry.id)}
      >
        <XIcon className="size-4" aria-hidden="true" />
      </Button>
      <div className="absolute bottom-2 left-2 z-10 rounded-md bg-black/45 px-2 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
        Pronta para envio
      </div>
    </article>
  );
}

export function GalleryWorkspace({
  assets,
  folders,
  activeFolderId,
  activeFolderName,
  unassignedSelected,
  totalAssetsCount,
  unassignedCount,
  flashMessage,
  representationDefaults,
  representationGate,
}: {
  assets: AssetListItem[];
  folders: AssetFolderListItem[];
  activeFolderId: string | null;
  activeFolderName: string | null;
  unassignedSelected: boolean;
  totalAssetsCount: number;
  unassignedCount: number;
  flashMessage: string | null;
  representationDefaults: ClientRepresentationDefaults;
  representationGate: ClientRepresentationUploadGate;
}) {
  const [state, action, pending] = useActionState(
    createAssetBatchAction,
    initialState,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filesRef = useRef<SelectedFile[]>([]);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [representationDialogDismissed, setRepresentationDialogDismissed] =
    useState(false);
  const fileInputId = useId();
  const uploadFormId = useId();

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    toast.success(flashMessage, {
      duration: 5_000,
    });

    const url = new URL(window.location.href);
    for (const key of FLASH_SEARCH_PARAMS) {
      url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [flashMessage]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, []);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function syncInputFiles(nextFiles: File[]) {
    const transfer = new DataTransfer();

    nextFiles.forEach((file) => transfer.items.add(file));

    if (inputRef.current) {
      inputRef.current.files = transfer.files;
    }
  }

  function mergeFiles(nextFileList: File[]) {
    setFiles((current) => {
      const currentIds = new Set(current.map((entry) => entry.id));
      const additions = nextFileList
        .filter((file) => file.type.startsWith("image/"))
        .filter((file) => !currentIds.has(buildFileId(file)))
        .map((file) => ({
          id: buildFileId(file),
          file,
          previewUrl: URL.createObjectURL(file),
        }));
      const merged = [...current, ...additions];

      syncInputFiles(merged.map((entry) => entry.file));
      return merged;
    });
  }

  function handleNativeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);

    if (selected.length > 0) {
      mergeFiles(selected);
    }
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const removed = current.find((entry) => entry.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      const filtered = current.filter((entry) => entry.id !== id);
      syncInputFiles(filtered.map((entry) => entry.file));
      return filtered;
    });
  }

  function clearFiles() {
    files.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    setFiles([]);
    syncInputFiles([]);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);

    if (dropped.length > 0) {
      mergeFiles(dropped);
    }
  }

  function handleDropAreaClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-no-upload='true']")
    ) {
      return;
    }

    openFilePicker();
  }

  const currentFolderLabel = activeFolderName
    ? activeFolderName
    : unassignedSelected
      ? "Sem pasta"
      : "Todas as imagens";
  const hasItems = files.length > 0 || assets.length > 0;
  const representationDialogOpen =
    state.status === "signature_required" && !representationDialogDismissed;

  return (
    <section
      className="relative flex w-full flex-1 flex-col gap-5 px-4 py-6 pb-28 md:px-8"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget === event.target) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <form
        id={uploadFormId}
        action={action}
        onSubmit={() => setRepresentationDialogDismissed(false)}
      >
        <input type="hidden" name="existingFolderId" value={activeFolderId ?? ""} />
        <input type="hidden" name="newFolderName" value="" />
        <input type="hidden" name="newFolderDescription" value="" />
        <input
          ref={inputRef}
          id={fileInputId}
          name="files"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleNativeChange}
          className="sr-only"
        />
      </form>

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Galeria
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {currentFolderLabel}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <RefreshDataButton size="sm" />
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <FolderPlusIcon className="size-4" aria-hidden="true" />
                Nova pasta
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Criar pasta</SheetTitle>
                <SheetDescription>
                  Organize imagens por campanha, cliente ou colecao.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                <AssetFolderForm />
              </div>
            </SheetContent>
          </Sheet>
          <Button type="button" size="sm" onClick={openFilePicker}>
            <ImagePlusIcon className="size-4" aria-hidden="true" />
            Subir imagem
          </Button>
        </div>
      </header>

      <AssetFolderFilter
        folders={folders}
        activeFolderId={activeFolderId}
        unassignedSelected={unassignedSelected}
        totalAssetsCount={totalAssetsCount}
        unassignedCount={unassignedCount}
      />

      {activeFolderId && activeFolderName ? (
        <RenameFolderForm
          key={`${activeFolderId}:${activeFolderName}`}
          folderId={activeFolderId}
          currentName={activeFolderName}
        />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={handleDropAreaClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
        className={cn(
          "relative min-h-[calc(100vh-18rem)] cursor-pointer rounded-lg border border-dashed border-border/70 bg-muted/[0.08] p-3 text-left outline-none transition-colors hover:border-primary/35 hover:bg-primary/[0.03] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
          isDragging && "border-primary bg-primary/5",
          !hasItems && "bg-muted/20 hover:border-primary/40 hover:bg-primary/5",
        )}
      >
        {hasItems ? (
          <div className="min-h-[calc(100vh-18rem)]">
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
              {files.map((entry) => (
                <PendingPreviewTile
                  key={entry.id}
                  entry={entry}
                  onRemove={removeFile}
                />
              ))}
              {assets.map((asset, index) => (
                <AssetGalleryTile
                  key={asset.id}
                  asset={asset}
                  prioritizeImage={index < 8}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-6 text-center text-sm font-medium text-muted-foreground">
              Clique em qualquer area vazia ou arraste novas imagens para adicionar mais arquivos.
            </div>
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-18rem)] w-full flex-col items-center justify-center rounded-lg px-6 py-14 text-center">
            <div className="rounded-full border border-border bg-background p-4 shadow-sm">
              <ImagesIcon className="size-7 text-muted-foreground" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight">
              Solte suas imagens aqui
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Clique na area vazia ou arraste arquivos para preparar o envio.
            </p>
          </div>
        )}
      </div>

      <ClientRepresentationRequiredDialog
        defaults={representationDefaults}
        gate={representationGate}
        open={representationDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRepresentationDialogDismissed(true);
          }
        }}
      />

      {state.message && state.status !== "signature_required" ? (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-xl rounded-lg border border-destructive/25 bg-background px-4 py-3 shadow-lg md:bottom-24">
          <FieldError>{state.message}</FieldError>
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-background/95 p-3 shadow-2xl backdrop-blur md:bottom-5 md:flex-row md:items-center md:justify-between md:px-4">
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {pluralizeImages(files.length)} pronta(s) para envio
            </p>
            <p className="text-sm text-muted-foreground">
              Nada foi enviado ainda. Confirme para iniciar o monitoramento.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="ghost" onClick={clearFiles}>
              <Trash2Icon className="size-4" aria-hidden="true" />
              Limpar
            </Button>
            <PendingSubmitButton
              formId={uploadFormId}
              disabled={files.length === 0}
              pending={pending}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
