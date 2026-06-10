"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  FolderPlusIcon,
  ImagesIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import {
  createAssetBatchAction,
  type AssetBatchActionState,
} from "@/app/actions/assets";
import { assetLicenseOptions } from "@/lib/asset-license";
import type { AssetFolderListItem } from "@/lib/dal/assets";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const initialState: AssetBatchActionState = {};

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

function formatBytes(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFileId(file: File) {
  return `${file.name}-${file.lastModified}-${file.size}`;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending || disabled}>
      {pending ? "Enviando imagens..." : "Enviar imagens"}
    </Button>
  );
}

export function AssetBatchUploadForm({
  folders,
}: {
  folders: AssetFolderListItem[];
}) {
  const [state, action] = useActionState(createAssetBatchAction, initialState);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [draftFolderId, setDraftFolderId] = useState("");
  const [draftFolderName, setDraftFolderName] = useState("");
  const dropzoneId = useId();

  useEffect(() => {
    return () => {
      files.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, [files]);

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

    if (selected.length === 0) {
      return;
    }

    mergeFiles(selected);
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

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);

    if (dropped.length === 0) {
      return;
    }

    mergeFiles(dropped);
  }

  function applyFolderSelection() {
    setFolderId(draftFolderId);
    setFolderName(draftFolderName.trim());
    setIsSheetOpen(false);
  }

  const selectedFolder = folders.find((folder) => folder.id === folderId) ?? null;
  const folderSummary = folderName || selectedFolder?.name || "Sem pasta";

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="existingFolderId" value={folderName ? "" : folderId} />
      <input type="hidden" name="newFolderName" value={folderName} />
      <input type="hidden" name="newFolderDescription" value="" />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
        <Field>
          <FieldLabel htmlFor="licenseType">Tipo de licenca</FieldLabel>
          <FieldContent>
            <select
              id="licenseType"
              name="licenseType"
              defaultValue="exclusive"
              className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {assetLicenseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Pasta</FieldLabel>
          <FieldContent>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full justify-between rounded-xl px-3 font-normal"
                onClick={() => {
                  setDraftFolderId(folderId);
                  setDraftFolderName(folderName);
                  setIsSheetOpen(true);
                }}
              >
                <span className="truncate">{folderSummary}</span>
                <FolderPlusIcon className="size-4 shrink-0" />
              </Button>

              <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Organizar em pasta</SheetTitle>
                  <SheetDescription>
                    Escolha uma pasta existente ou defina o nome de uma nova pasta para estas imagens.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="sheet-folder-select">Pasta existente</FieldLabel>
                      <FieldContent>
                        <select
                          id="sheet-folder-select"
                          value={draftFolderId}
                          onChange={(event) => setDraftFolderId(event.target.value)}
                          className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                        >
                          <option value="">Sem pasta</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                        <FieldDescription>
                          Se voce informar um nome novo abaixo, ele tera prioridade sobre esta selecao.
                        </FieldDescription>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="sheet-folder-name">Nova pasta</FieldLabel>
                      <FieldContent>
                        <Input
                          id="sheet-folder-name"
                          value={draftFolderName}
                          onChange={(event) => setDraftFolderName(event.target.value)}
                          placeholder="Ex.: Campanha Maio 2026"
                        />
                        <FieldDescription>
                          A pasta sera criada automaticamente quando voce enviar as imagens.
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </div>

                <SheetFooter>
                  <SheetClose asChild>
                    <Button type="button" variant="ghost">
                      Cancelar
                    </Button>
                  </SheetClose>
                  <Button type="button" onClick={applyFolderSelection}>
                    Aplicar pasta
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </FieldContent>
        </Field>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <label
          htmlFor={dropzoneId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5"
          }`}
        >
          <div className="rounded-full bg-background p-4 shadow-sm">
            <UploadIcon className="size-7 text-muted-foreground" />
          </div>
          <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
            Arraste imagens aqui ou clique para selecionar
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            As imagens aparecem abaixo para revisao visual antes do envio. Nenhum upload comeca ate voce confirmar.
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
            <ImagesIcon className="size-4" />
            <span>Ate 30 imagens por envio</span>
          </div>

          <input
            ref={inputRef}
            id={dropzoneId}
            name="files"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleNativeChange}
            className="sr-only"
          />
        </label>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {files.length} imagem(ns) pronta(s) para envio
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Revise a selecao abaixo antes de enviar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                files.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
                setFiles([]);
                syncInputFiles([]);
              }}
              disabled={files.length === 0}
            >
              Limpar
            </Button>
            <SubmitButton disabled={files.length === 0} />
          </div>
        </div>

        {files.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {files.map((entry) => (
              <article
                key={entry.id}
                className="overflow-hidden rounded-2xl border border-border bg-background"
              >
                <div className="relative aspect-square bg-muted/40">
                  <img
                    src={entry.previewUrl}
                    alt={entry.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.file.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(entry.file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFile(entry.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhuma imagem selecionada ainda.
          </div>
        )}
      </div>

      <FieldError>{state.message}</FieldError>
    </form>
  );
}
