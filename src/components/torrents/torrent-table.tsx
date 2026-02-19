import { useState, useMemo, useCallback } from "react";
import type { TorrentStatus } from "@/api/types";
import { cn, formatBytes, formatSpeed, formatETA, formatRatio, torrentStateColor, progressColor } from "@/lib/utils";
import { store } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { ArrowUp, ArrowDown, Plus, Search, FilterX, Columns3 } from "lucide-react";

interface TorrentTableProps {
  torrents: (TorrentStatus & { hash: string })[];
  selectedHashes: Set<string>;
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
  onSelectAll: () => void;
  onAction: (action: string) => void;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

type SortDir = "asc" | "desc";

const ALL_COLUMNS = [
  { key: "name", label: "Name", className: "flex-[3] min-w-[140px]", alwaysVisible: true },
  { key: "size", label: "Size", className: "w-24 text-right", hideBelow: "md" as const },
  { key: "progress", label: "Progress", className: "w-28", alwaysVisible: true },
  { key: "state", label: "Status", className: "w-24", alwaysVisible: true },
  { key: "download_payload_rate", label: "Down", className: "w-24 text-right", alwaysVisible: true },
  { key: "upload_payload_rate", label: "Up", className: "w-24 text-right", alwaysVisible: true },
  { key: "eta", label: "ETA", className: "w-20 text-right", hideBelow: "lg" as const },
  { key: "ratio", label: "Ratio", className: "w-16 text-right", hideBelow: "lg" as const },
  { key: "num_seeds", label: "Seeds", className: "w-20 text-right", hideBelow: "xl" as const },
  { key: "num_peers", label: "Peers", className: "w-20 text-right", hideBelow: "xl" as const },
] as const;

function getResponsiveClass(col: typeof ALL_COLUMNS[number]): string {
  if ("alwaysVisible" in col && col.alwaysVisible) return col.className;
  if ("hideBelow" in col) {
    const bp = col.hideBelow;
    return `hidden ${bp}:block ${col.className}`;
  }
  return col.className;
}

function getSortValue(torrent: TorrentStatus, key: string): string | number {
  switch (key) {
    case "name": return torrent.name.toLowerCase();
    case "size": return torrent.total_size;
    case "progress": return torrent.progress;
    case "state": return torrent.state;
    case "download_payload_rate": return torrent.download_payload_rate;
    case "upload_payload_rate": return torrent.upload_payload_rate;
    case "eta": return torrent.eta;
    case "ratio": return torrent.ratio;
    case "num_seeds": return torrent.num_seeds;
    case "num_peers": return torrent.num_peers;
    default: return 0;
  }
}

export function TorrentTable({
  torrents,
  selectedHashes,
  onSelect,
  onSelectAll,
  onAction,
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: TorrentTableProps) {
  const [sortColumn, setSortColumn] = useState(store.getSortColumn());
  const [sortDir, setSortDir] = useState<SortDir>(store.getSortDirection());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(store.getSelectedColumns());
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => visibleColumns.includes(col.key)),
    [visibleColumns]
  );

  const sorted = useMemo(() => {
    const copy = [...torrents];
    copy.sort((a, b) => {
      const va = getSortValue(a, sortColumn);
      const vb = getSortValue(b, sortColumn);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [torrents, sortColumn, sortDir]);

  function handleSort(key: string) {
    if (sortColumn === key) {
      const next = sortDir === "asc" ? "desc" : "asc";
      setSortDir(next);
      store.setSortDirection(next);
    } else {
      setSortColumn(key);
      setSortDir("asc");
      store.setSortColumn(key);
      store.setSortDirection("asc");
    }
  }

  const toggleColumn = useCallback((key: string) => {
    setVisibleColumns((prev) => {
      const next = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];
      store.setSelectedColumns(next);
      return next;
    });
  }, []);

  const allSelected = torrents.length > 0 && selectedHashes.size === torrents.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center border-b bg-muted/50 px-3 text-xs font-medium text-muted-foreground">
        <div className="w-7 shrink-0 flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="h-3.5 w-3.5"
            title="Select All (Ctrl+A)"
          />
        </div>
        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={cn(
              "flex items-center gap-1 px-2 py-2 hover:text-foreground transition-colors",
              getResponsiveClass(col)
            )}
          >
            {col.label}
            {sortColumn === col.key && (
              sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            )}
          </button>
        ))}
        <div className="relative ml-auto shrink-0">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="p-1 hover:text-foreground transition-colors"
            title="Column visibility"
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          {showColumnPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border bg-popover p-2 shadow-md">
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 py-1 text-xs cursor-pointer hover:text-foreground">
                    <Checkbox
                      checked={visibleColumns.includes(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                      className="h-3 w-3"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rows */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center border-b px-3 py-3">
                <div className="w-7 shrink-0" />
                <div className="flex-[3] min-w-[140px] px-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
                <div className="hidden md:block w-24 px-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted ml-auto" />
                </div>
                <div className="w-28 px-2">
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
                </div>
                <div className="w-24 px-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="w-24 px-2">
                  <div className="h-4 w-14 animate-pulse rounded bg-muted ml-auto" />
                </div>
                <div className="w-24 px-2">
                  <div className="h-4 w-14 animate-pulse rounded bg-muted ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
            {hasActiveFilters ? (
              <>
                <Search className="h-10 w-10 opacity-30" />
                <p className="text-sm">No torrents match your filter</p>
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-1.5 text-sm text-dl hover:underline"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Plus className="h-10 w-10 opacity-30" />
                <p className="text-sm">No torrents yet</p>
                <p className="text-xs">
                  Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">A</kbd> or click{" "}
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">+</kbd> to add your first torrent
                </p>
              </>
            )}
          </div>
        ) : (
          sorted.map((torrent) => (
            <ContextMenu
              key={torrent.hash}
              content={
                <TorrentContextMenuContent
                  torrent={torrent}
                  onAction={onAction}
                />
              }
            >
              <TorrentRow
                torrent={torrent}
                selected={selectedHashes.has(torrent.hash)}
                columns={columns}
                onSelect={onSelect}
              />
            </ContextMenu>
          ))
        )}
      </ScrollArea>
    </div>
  );
}

function TorrentContextMenuContent({
  torrent,
  onAction,
}: {
  torrent: TorrentStatus & { hash: string };
  onAction: (action: string) => void;
}) {
  return (
    <>
      {torrent.state === "Paused" ? (
        <ContextMenuItem onClick={() => onAction("resume")}>Resume</ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => onAction("pause")}>Pause</ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onAction("recheck")}>Force Recheck</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("queue_top")}>Move to Top</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("queue_up")}>Move Up</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("queue_down")}>Move Down</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("queue_bottom")}>Move to Bottom</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onAction("copy_name")}>Copy Name</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("copy_hash")}>Copy Hash</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onAction("generate_nfo")}>Generate NFO</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive onClick={() => onAction("remove")}>
        Remove
      </ContextMenuItem>
    </>
  );
}

function TorrentRow({
  torrent,
  selected,
  columns,
  onSelect,
}: {
  torrent: TorrentStatus & { hash: string };
  selected: boolean;
  columns: readonly (typeof ALL_COLUMNS[number])[];
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
}) {
  return (
    <div
      onClick={(e) => onSelect(torrent.hash, e.ctrlKey || e.metaKey, e.shiftKey)}
      className={cn(
        "flex items-center border-b px-3 text-sm cursor-pointer transition-colors",
        selected
          ? "bg-accent/80 text-accent-foreground"
          : "hover:bg-muted/50"
      )}
    >
      <div className="w-7 shrink-0 flex items-center justify-center">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-sm border",
            selected ? "bg-primary border-primary" : "border-muted-foreground/40"
          )}
        />
      </div>
      {columns.map((col) => (
        <TorrentCell key={col.key} col={col} torrent={torrent} />
      ))}
    </div>
  );
}

function TorrentCell({ col, torrent }: { col: typeof ALL_COLUMNS[number]; torrent: TorrentStatus & { hash: string } }) {
  const cls = getResponsiveClass(col);

  switch (col.key) {
    case "name":
      return <div className={cn("truncate px-2 py-2", cls)}>{torrent.name}</div>;
    case "size":
      return <div className={cn("px-2 py-2 text-xs text-muted-foreground", cls)}>{formatBytes(torrent.total_size)}</div>;
    case "progress":
      return (
        <div className={cn("px-2 py-2", cls)}>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", progressColor(torrent.progress, torrent.state))}
                style={{ width: `${Math.min(torrent.progress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-10 text-right">
              {torrent.progress.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    case "state":
      return <div className={cn("px-2 py-2 text-xs font-medium", cls, torrentStateColor(torrent.state))}>{torrent.state}</div>;
    case "download_payload_rate":
      return (
        <div className={cn("px-2 py-2 text-xs", cls)}>
          {torrent.download_payload_rate > 0
            ? <span className="text-dl">{formatSpeed(torrent.download_payload_rate)}</span>
            : <span className="text-muted-foreground">—</span>}
        </div>
      );
    case "upload_payload_rate":
      return (
        <div className={cn("px-2 py-2 text-xs", cls)}>
          {torrent.upload_payload_rate > 0
            ? <span className="text-ul">{formatSpeed(torrent.upload_payload_rate)}</span>
            : <span className="text-muted-foreground">—</span>}
        </div>
      );
    case "eta":
      return <div className={cn("px-2 py-2 text-xs text-muted-foreground", cls)}>{torrent.eta > 0 ? formatETA(torrent.eta) : "—"}</div>;
    case "ratio":
      return <div className={cn("px-2 py-2 text-xs text-muted-foreground", cls)}>{formatRatio(torrent.ratio)}</div>;
    case "num_seeds":
      return <div className={cn("px-2 py-2 text-xs text-muted-foreground", cls)}>{torrent.num_seeds} ({torrent.total_seeds})</div>;
    case "num_peers":
      return <div className={cn("px-2 py-2 text-xs text-muted-foreground", cls)}>{torrent.num_peers} ({torrent.total_peers})</div>;
    default:
      return null;
  }
}
