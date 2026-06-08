import { requirePanelAccess } from "@/lib/auth";
import { createClient } from "@/lib/server";

export type MonitoredSourceListItem = {
  id: string;
  name: string;
  domain: string;
  baseUrl: string;
  sourceType: string;
  priority: "high" | "medium" | "low";
  crawlFrequencyHours: number;
  discoveryModes: string[];
  sitemapUrls: string[];
  crawlWindowDays: number;
  maxPagesPerRun: number;
  isActive: boolean;
  lastCrawledAt: string | null;
  createdAt: string;
};

export type SourceCrawlRunListItem = {
  id: string;
  sourceId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  pagesDiscovered: number;
  pagesCrawled: number;
  imagesDiscovered: number;
  matchesCreated: number;
  errorMessage: string | null;
};

type SourceRow = {
  id: string;
  name: string;
  domain: string;
  base_url: string;
  source_type: string;
  priority: "high" | "medium" | "low";
  crawl_frequency_hours: number;
  discovery_modes: string[];
  sitemap_urls?: string[];
  crawl_window_days?: number;
  max_pages_per_run?: number;
  is_active: boolean;
  last_crawled_at: string | null;
  created_at: string;
};

type CrawlRunRow = {
  id: string;
  source_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  pages_discovered: number;
  pages_crawled: number;
  images_discovered: number;
  matches_created: number;
  error_message: string | null;
};

function isMissingSourcesSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return candidate.code === "42P01" || combinedMessage.includes("monitored_sources");
}

export async function listMonitoredSources(): Promise<{
  sources: MonitoredSourceListItem[];
  latestRuns: Map<string, SourceCrawlRunListItem>;
  schemaMissing: boolean;
}> {
  await requirePanelAccess("admin");
  const supabase = await createClient();
  const { data: sources, error: sourcesError } = await supabase
    .from("monitored_sources")
    .select(
      "id, name, domain, base_url, source_type, priority, crawl_frequency_hours, discovery_modes, sitemap_urls, crawl_window_days, max_pages_per_run, is_active, last_crawled_at, created_at",
    )
    .order("priority", { ascending: true })
    .order("name", { ascending: true });

  if (sourcesError) {
    if (isMissingSourcesSchemaError(sourcesError)) {
      return {
        sources: [],
        latestRuns: new Map(),
        schemaMissing: true,
      };
    }

    throw new Error("Nao foi possivel carregar as fontes monitoradas.");
  }

  const sourceRows = (sources ?? []) as SourceRow[];
  const sourceIds = sourceRows.map((source) => source.id);
  const latestRuns = new Map<string, SourceCrawlRunListItem>();

  if (sourceIds.length > 0) {
    const { data: runs, error: runsError } = await supabase
      .from("source_crawl_runs")
      .select(
        "id, source_id, status, started_at, finished_at, pages_discovered, pages_crawled, images_discovered, matches_created, error_message",
      )
      .in("source_id", sourceIds)
      .order("created_at", { ascending: false })
      .limit(sourceIds.length * 3);

    if (runsError && !isMissingSourcesSchemaError(runsError)) {
      throw new Error("Nao foi possivel carregar as execucoes das fontes.");
    }

    for (const run of (runs ?? []) as CrawlRunRow[]) {
      if (latestRuns.has(run.source_id)) {
        continue;
      }

      latestRuns.set(run.source_id, {
        id: run.id,
        sourceId: run.source_id,
        status: run.status,
        startedAt: run.started_at,
        finishedAt: run.finished_at,
        pagesDiscovered: run.pages_discovered,
        pagesCrawled: run.pages_crawled,
        imagesDiscovered: run.images_discovered,
        matchesCreated: run.matches_created,
        errorMessage: run.error_message,
      });
    }
  }

  return {
    sources: sourceRows.map((source) => ({
      id: source.id,
      name: source.name,
      domain: source.domain,
      baseUrl: source.base_url,
      sourceType: source.source_type,
      priority: source.priority,
      crawlFrequencyHours: source.crawl_frequency_hours,
      discoveryModes: source.discovery_modes,
      sitemapUrls: source.sitemap_urls ?? [],
      crawlWindowDays: source.crawl_window_days ?? 2,
      maxPagesPerRun: source.max_pages_per_run ?? 50,
      isActive: source.is_active,
      lastCrawledAt: source.last_crawled_at,
      createdAt: source.created_at,
    })),
    latestRuns,
    schemaMissing: false,
  };
}
