import { useRef, useState, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TorrentStatus } from "@/api/types";
import {
  cn,
  formatSpeed,
  formatETA,
  formatRatio,
  ratioColor,
  torrentStateColor,
  progressColor,
  trackerHealth,
} from "@/lib/utils";
import { store } from "@/lib/store";
import { ArrowUp, ArrowDown, CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { MoreVertical, Plus, Search, FilterX } from "lucide-react";
import type { DateFilter } from "@/hooks/use-dashboard-state";

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: "All time",
  today: "Today",
  week: "Last 7 days",
  month: "Last 30 days",
};

const CARD_HEIGHT_PX = 88;

const SORT_OPTIONS = [
  { key: "name", label: "Name" },
  { key: "ratio", label: "Ratio" },
  { key: "total_size", label: "Size" },
  { key: "state", label: "State" },
  { key: "time_added", label: "Added" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["key"];

function sortTorrents(list: (TorrentStatus & { hash: string })[], col: SortKey, dir: "asc" | "desc") {
  return [...list].sort((a, b) => {
    const va = a[col];
    const vb = b[col];
    const cmp = typeof va === "string" && typeof vb === "string"
      ? va.localeCompare(vb)
      : (va as number) < (vb as number) ? -1 : (va as number) > (vb as number) ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}

interface TorrentCardListProps {
  torrents: (TorrentStatus & { hash: string })[];
  selectedHashes: Set<string>;
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
  onAction: (action: string) => void;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  dateFilter?: DateFilter;
  onDateFilter?: (f: DateFilter) => void;
}

export function TorrentCardList({
  torrents,
  selectedHashes,
  onSelect,
  onAction,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  dateFilter = "all",
  onDateFilter,
}: TorrentCardListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sortCol, setSortCol] = useState<SortKey>(() => store.getMobileSortColumn() as SortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(() => store.getMobileSortDir());

  function handleSort(key: SortKey) {
    if (key === sortCol) {
      const next = sortDir === "asc" ? "desc" : "asc";
      setSortDir(next);
      store.setMobileSortDir(next);
    } else {
      setSortCol(key);
      setSortDir("asc");
      store.setMobileSortColumn(key);
      store.setMobileSortDir("asc");
    }
  }

  const sorted = useMemo(() => sortTorrents(torrents, sortCol, sortDir), [torrents, sortCol, sortDir]);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT_PX,
    overscan: 5,
  });

  // Scroll to selected card when selection changes externally (arrow key nav)
  useEffect(() => {
    if (selectedHashes.size !== 1) return;
    const hash = [...selectedHashes][0];
    const idx = sorted.findIndex((t) => t.hash === hash);
    if (idx >= 0) virtualizer.scrollToIndex(idx, { align: "auto" });
  }, [selectedHashes]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (torrents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
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
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Sort bar + optional filter chip */}
      <div className="flex items-center border-b shrink-0">
        <div className="relative flex flex-1 items-center gap-1 px-3 py-1.5 overflow-x-auto">
          <span className="text-xs text-muted-foreground shrink-0 mr-1">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                "flex items-center gap-0.5 text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 min-h-[30px]",
                sortCol === opt.key
                  ? "border-ring bg-accent text-accent-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
              {sortCol === opt.key && (
                sortDir === "asc"
                  ? <ArrowUp className="h-2.5 w-2.5" />
                  : <ArrowDown className="h-2.5 w-2.5" />
              )}
            </button>
          ))}
          {/* Right-edge fade to hint horizontal scroll */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background" />
        </div>
        {onDateFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex shrink-0 items-center gap-1 border-l px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors",
                dateFilter !== "all" ? "text-brand" : "text-muted-foreground"
              )}
              title="Filter by date added"
            >
              <CalendarDays className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onDateFilter(key)}
                  className={cn(dateFilter === key && "font-medium text-brand")}
                >
                  {DATE_FILTER_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex shrink-0 items-center gap-1 border-l px-2.5 py-1.5 text-xs text-dl hover:bg-muted/50 transition-colors"
            title="Clear filters"
          >
            <FilterX className="h-3.5 w-3.5" />
            <span>Filtered</span>
          </button>
        )}
      </div>
    <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-2">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const torrent = sorted[virtualRow.index];
          const selected = selectedHashes.has(torrent.hash);
          return (
            <div
              key={torrent.hash}
              className="absolute left-0 w-full pb-2"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <TorrentCard
                torrent={torrent}
                selected={selected}
                onSelect={onSelect}
                onAction={onAction}
              />
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

function TorrentCard({
  torrent,
  selected,
  onSelect,
  onAction,
}: {
  torrent: TorrentStatus & { hash: string };
  selected: boolean;
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
  onAction: (action: string) => void;
}) {
  const stateColor = torrentStateColor(torrent.state);
  const barColor = progressColor(torrent.progress, torrent.state);
  const isDownloading = torrent.state === "Downloading";
  const showETA = isDownloading && torrent.eta > 0 && isFinite(torrent.eta);

  const contextMenuContent = (
    <>
      <ContextMenuLabel>{torrent.state}</ContextMenuLabel>
      <ContextMenuSeparator />
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
      <ContextMenuItem onClick={() => onAction("set_label")}>Set Label…</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("move_storage")}>Move Storage…</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("generate_nfo")}>Generate NFO</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive onClick={() => onAction("remove")}>Remove</ContextMenuItem>
    </>
  );

  return (
    <ContextMenu content={contextMenuContent} enableLongPress>
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 h-[80px] cursor-pointer transition-colors",
        selected ? "bg-accent ring-1 ring-ring" : "hover:bg-muted/50"
      )}
      onClick={() => onSelect(torrent.hash, false)}
    >
      {/* State dot */}
      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full bg-current", stateColor)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {/* Name */}
        <div className="flex items-center gap-1.5 min-w-0">
          {trackerHealth(torrent.message) === "error" && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-state-error"
              title={torrent.message}
            />
          )}
          <p className="truncate text-sm font-medium leading-tight">{torrent.name}</p>
        </div>

        {/* Progress bar + percentage */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full", barColor)}
              style={{ width: `${Math.min(torrent.progress, 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
            {torrent.progress.toFixed(0)}%
          </span>
        </div>

        {/* Stats row: state · speeds · ratio [· ETA] */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("shrink-0 font-medium", stateColor)}>
            {torrent.state}
          </span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">↓ {formatSpeed(torrent.download_payload_rate)}</span>
          <span className="shrink-0">↑ {formatSpeed(torrent.upload_payload_rate)}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className={cn("font-medium", ratioColor(torrent.ratio))}>R {formatRatio(torrent.ratio)}</span>
            {showETA && <><span>·</span><span>ETA {formatETA(torrent.eta)}</span></>}
          </span>
        </div>
      </div>

      {/* Action menu — selects the torrent first so actions target the right one */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="shrink-0 rounded p-1.5 opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(torrent.hash, false);
          }}
          aria-label="Torrent actions"
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {torrent.state === "Paused" ? (
            <DropdownMenuItem onClick={() => onAction("resume")}>Resume</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onAction("pause")}>Pause</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction("recheck")}>Force Recheck</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("queue_top")}>Move to Top</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("queue_up")}>Move Up</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("queue_down")}>Move Down</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("queue_bottom")}>Move to Bottom</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction("copy_name")}>Copy Name</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("copy_hash")}>Copy Hash</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction("set_label")}>Set Label…</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("move_storage")}>Move storage…</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("generate_nfo")}>Generate NFO</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onAction("remove")}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    </ContextMenu>
  );
}
