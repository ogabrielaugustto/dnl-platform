import Link from "next/link";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { AssetFolderListItem } from "@/lib/dal/assets";

function filterClasses(isActive: boolean) {
  return isActive
    ? "border-primary bg-primary/10 text-foreground"
    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground";
}

function buildAssetsHref({ folder }: { folder: string | null }) {
  const searchParams = new URLSearchParams();

  if (folder) {
    searchParams.set("folder", folder);
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
}: {
  folders: AssetFolderListItem[];
  activeFolderId: string | null;
  unassignedSelected: boolean;
  totalAssetsCount: number;
  unassignedCount: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Pastas
            <InfoTooltip content="Gerencie suas pastas para organizar as imagens por tema, cliente, campanha ou qualquer criterio que faça sentido para voce." />
          </span>
          <Link
            href={buildAssetsHref({ folder: null })}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${filterClasses(!activeFolderId && !unassignedSelected)}`}
          >
            <span className="font-medium">Todas</span>
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground">
              {totalAssetsCount}
            </span>
          </Link>

          <Link
            href={buildAssetsHref({ folder: "unassigned" })}
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
              href={buildAssetsHref({ folder: folder.id })}
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
      </div>
    </div>
  );
}
