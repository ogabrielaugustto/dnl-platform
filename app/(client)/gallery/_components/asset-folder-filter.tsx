import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { AssetFolderListItem } from "@/lib/dal/assets";

type AssetViewMode = "cards" | "rows";

function filterClasses(isActive: boolean) {
  return isActive
    ? "border-primary bg-primary/10 text-foreground"
    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground";
}

function viewClasses(isActive: boolean) {
  return isActive
    ? "border-primary bg-primary text-primary-foreground "
    : "border-border bg-background text-muted-foreground hover:text-foreground";
}

function buildAssetsHref({
  folder,
  viewMode,
}: {
  folder: string | null;
  viewMode: AssetViewMode;
}) {
  const searchParams = new URLSearchParams();

  if (folder) {
    searchParams.set("folder", folder);
  }

  if (viewMode === "rows") {
    searchParams.set("view", "rows");
  }

  const query = searchParams.toString();
  return query ? `/gallery?${query}` : "/gallery";
}

export function AssetFolderFilter({
  folders,
  activeFolderId,
  unassignedSelected,
  totalAssetsCount,
  unassignedCount,
  viewMode,
}: {
  folders: AssetFolderListItem[];
  activeFolderId: string | null;
  unassignedSelected: boolean;
  totalAssetsCount: number;
  unassignedCount: number;
  viewMode: AssetViewMode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 ">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Pastas
            <InfoTooltip content="Gerencie suas pastas para organizar as imagens por tema, cliente, campanha ou qualquer criterio que faça sentido para voce." />
          </span>
          <Link
            href={buildAssetsHref({ folder: null, viewMode })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(!activeFolderId && !unassignedSelected)}`}
          >
            <span className="font-medium">Todas</span>
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground">
              {totalAssetsCount}
            </span>
          </Link>

          <Link
            href={buildAssetsHref({ folder: "unassigned", viewMode })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(unassignedSelected)}`}
          >
            <span className="font-medium">Sem pasta</span>
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground">
              {unassignedCount}
            </span>
          </Link>

          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={buildAssetsHref({ folder: folder.id, viewMode })}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(activeFolderId === folder.id)}`}
              title={folder.description ?? folder.name}
            >
              <span className="max-w-40 truncate font-medium">{folder.name}</span>
              <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground">
                {folder.assetsCount}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Visualizacao
            </span>
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              <Link
                href={buildAssetsHref({
                  folder: unassignedSelected
                    ? "unassigned"
                    : activeFolderId,
                  viewMode: "cards",
                })}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewClasses(viewMode === "cards")}`}
              >
                Grade
              </Link>
              <Link
                href={buildAssetsHref({
                  folder: unassignedSelected
                    ? "unassigned"
                    : activeFolderId,
                  viewMode: "rows",
                })}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${viewClasses(viewMode === "rows")}`}
              >
                Lista
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
