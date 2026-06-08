"use client";

import { useActionState } from "react";
import {
  saveMonitoredSourceAction,
  toggleMonitoredSourceAction,
  type SourceActionState,
} from "@/app/actions/sources";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { MonitoredSourceListItem } from "@/lib/dal/sources";

const initialState: SourceActionState = {};

const sourceTypeOptions = [
  ["portal", "Portal"],
  ["blog", "Blog"],
  ["ecommerce", "E-commerce"],
  ["government", "Governo"],
  ["marketplace", "Marketplace"],
  ["other", "Outro"],
] as const;

const priorityOptions = [
  ["high", "Alta"],
  ["medium", "Media"],
  ["low", "Baixa"],
] as const;

function ActionMessage({ state }: { state: SourceActionState }) {
  if (!state.message) {
    return null;
  }

  return state.status === "success" ? (
    <p className="text-sm text-emerald-600">{state.message}</p>
  ) : (
    <FieldError>{state.message}</FieldError>
  );
}

function SourceFields({ source }: { source?: MonitoredSourceListItem }) {
  const modes = new Set(source?.discoveryModes ?? ["sitemap"]);

  return (
    <>
      {source ? <input type="hidden" name="sourceId" value={source.id} /> : null}
      <Input
        name="name"
        defaultValue={source?.name}
        placeholder="Casa Vogue"
        maxLength={120}
        required
        aria-label="Nome da fonte"
      />
      <Input
        name="baseUrl"
        type="url"
        defaultValue={source?.baseUrl}
        placeholder="https://casavogue.globo.com/"
        required
        aria-label="URL base"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Tipo
          <select
            name="sourceType"
            defaultValue={source?.sourceType ?? "portal"}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {sourceTypeOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Prioridade
          <select
            name="priority"
            defaultValue={source?.priority ?? "medium"}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {priorityOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Frequencia
          <Input
            name="crawlFrequencyHours"
            type="number"
            min={1}
            max={720}
            defaultValue={source?.crawlFrequencyHours ?? 24}
            aria-label="Frequencia em horas"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Janela
          <Input
            name="crawlWindowDays"
            type="number"
            min={1}
            max={3650}
            defaultValue={source?.crawlWindowDays ?? 2}
            aria-label="Janela de crawl em dias"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Limite de paginas
          <Input
            name="maxPagesPerRun"
            type="number"
            min={1}
            max={2000}
            defaultValue={source?.maxPagesPerRun ?? 50}
            aria-label="Maximo de paginas por execucao"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {(["sitemap", "rss", "home"] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2">
            <Checkbox
              name="discoveryModes"
              value={mode}
              defaultChecked={modes.has(mode)}
            />
            {mode === "sitemap" ? "Sitemap" : mode === "rss" ? "RSS" : "Home"}
          </label>
        ))}
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Sitemaps explicitos
        <textarea
          name="sitemapUrls"
          defaultValue={source?.sitemapUrls.join("\n")}
          placeholder="https://casavogue.globo.com/sitemap/casavogue/sitemap.xml"
          className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        />
      </label>
    </>
  );
}

export function CreateSourceForm() {
  const [state, action] = useActionState(saveMonitoredSourceAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Nova fonte</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre dominios publicos para a varredura dirigida do worker.
        </p>
      </div>
      <SourceFields />
      <ActionMessage state={state} />
      <Button type="submit" className="w-fit">
        Cadastrar fonte
      </Button>
    </form>
  );
}

export function SourceInlineForm({ source }: { source: MonitoredSourceListItem }) {
  const [saveState, saveAction] = useActionState(saveMonitoredSourceAction, initialState);
  const [toggleState, toggleAction] = useActionState(toggleMonitoredSourceAction, initialState);

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4">
      <form action={saveAction} className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {source.domain}
            </p>
            <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">
              {source.name}
            </h3>
          </div>
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            {source.isActive ? "Ativa" : "Pausada"}
          </span>
        </div>
        <SourceFields source={source} />
        <ActionMessage state={saveState} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline">
            Salvar
          </Button>
        </div>
      </form>
      <form action={toggleAction}>
        <input type="hidden" name="sourceId" value={source.id} />
        <input type="hidden" name="nextIsActive" value={source.isActive ? "false" : "true"} />
        <Button type="submit" variant="ghost">
          {source.isActive ? "Pausar fonte" : "Ativar fonte"}
        </Button>
        <ActionMessage state={toggleState} />
      </form>
    </div>
  );
}
