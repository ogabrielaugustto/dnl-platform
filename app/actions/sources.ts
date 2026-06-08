"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePanelAccess } from "@/lib/auth";
import { createClient } from "@/lib/server";

const sourceTypes = ["portal", "blog", "ecommerce", "government", "marketplace", "other"] as const;
const sourcePriorities = ["high", "medium", "low"] as const;
const discoveryModes = ["sitemap", "rss", "home"] as const;

const sourceSchema = z.object({
  sourceId: z.uuid().optional(),
  name: z.string().trim().min(2, "Informe um nome para a fonte.").max(120),
  baseUrl: z.string().trim().url("Informe uma URL base valida."),
  sourceType: z.enum(sourceTypes),
  priority: z.enum(sourcePriorities),
  crawlFrequencyHours: z.coerce.number().int().min(1).max(720),
  crawlWindowDays: z.coerce.number().int().min(1).max(3650),
  maxPagesPerRun: z.coerce.number().int().min(1).max(2000),
  sitemapUrls: z.string().trim().optional(),
  discoveryModes: z
    .array(z.enum(discoveryModes))
    .min(1, "Selecione pelo menos uma forma de descoberta."),
});

const toggleSourceSchema = z.object({
  sourceId: z.uuid(),
  nextIsActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type SourceActionState = {
  message?: string;
  status?: "error" | "success";
};

function normalizeDomain(baseUrl: string) {
  return new URL(baseUrl).hostname.toLowerCase();
}

function normalizeBaseUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

function parseSourceForm(formData: FormData) {
  const sourceId = formData.get("sourceId");

  return sourceSchema.safeParse({
    sourceId: typeof sourceId === "string" && sourceId.length > 0 ? sourceId : undefined,
    name: formData.get("name"),
    baseUrl: formData.get("baseUrl"),
    sourceType: formData.get("sourceType"),
    priority: formData.get("priority"),
    crawlFrequencyHours: formData.get("crawlFrequencyHours"),
    crawlWindowDays: formData.get("crawlWindowDays"),
    maxPagesPerRun: formData.get("maxPagesPerRun"),
    sitemapUrls: formData.get("sitemapUrls"),
    discoveryModes: formData.getAll("discoveryModes"),
  });
}

function parseSitemapUrls(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => z.url().safeParse(item).success);
}

function getSourceMutationMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Nao foi possivel salvar esta fonte agora.";
  }

  const candidate = error as { code?: string; message?: string; details?: string };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  if (candidate.code === "42P01" || combinedMessage.includes("monitored_sources")) {
    return "A migration de fontes monitoradas ainda nao foi aplicada neste ambiente.";
  }

  if (candidate.code === "23505") {
    return "Ja existe uma fonte cadastrada para este dominio.";
  }

  return "Nao foi possivel salvar esta fonte agora.";
}

export async function saveMonitoredSourceAction(
  _: SourceActionState,
  formData: FormData,
): Promise<SourceActionState> {
  const parsed = parseSourceForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  await requirePanelAccess("admin");
  const supabase = await createClient();
  const baseUrl = normalizeBaseUrl(parsed.data.baseUrl);
  const payload = {
    name: parsed.data.name,
    domain: normalizeDomain(baseUrl),
    base_url: baseUrl,
    source_type: parsed.data.sourceType,
    priority: parsed.data.priority,
    crawl_frequency_hours: parsed.data.crawlFrequencyHours,
    crawl_window_days: parsed.data.crawlWindowDays,
    max_pages_per_run: parsed.data.maxPagesPerRun,
    sitemap_urls: parseSitemapUrls(parsed.data.sitemapUrls),
    discovery_modes: parsed.data.discoveryModes,
  };

  if (parsed.data.sourceId) {
    const { error } = await supabase
      .from("monitored_sources")
      .update(payload)
      .eq("id", parsed.data.sourceId);

    if (error) {
      return {
        status: "error",
        message: getSourceMutationMessage(error),
      };
    }

    revalidatePath("/admin/sources");

    return {
      status: "success",
      message: "Fonte atualizada.",
    };
  }

  const { error } = await supabase.from("monitored_sources").insert(payload);

  if (error) {
    return {
      status: "error",
      message: getSourceMutationMessage(error),
    };
  }

  revalidatePath("/admin/sources");

  return {
    status: "success",
    message: "Fonte cadastrada.",
  };
}

export async function toggleMonitoredSourceAction(
  _: SourceActionState,
  formData: FormData,
): Promise<SourceActionState> {
  const parsed = toggleSourceSchema.safeParse({
    sourceId: formData.get("sourceId"),
    nextIsActive: formData.get("nextIsActive"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("monitored_sources")
    .update({
      is_active: parsed.data.nextIsActive,
    })
    .eq("id", parsed.data.sourceId);

  if (error) {
    return {
      status: "error",
      message: getSourceMutationMessage(error),
    };
  }

  revalidatePath("/admin/sources");

  return {
    status: "success",
    message: parsed.data.nextIsActive ? "Fonte ativada." : "Fonte pausada.",
  };
}
