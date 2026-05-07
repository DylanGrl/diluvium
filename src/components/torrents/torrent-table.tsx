import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TorrentStatus } from "@/api/types";
import {
  cn,
  formatBytes,
  formatSpeed,
  formatETA,
  formatRatio,
  formatDate,
  ratioColor,
  torrentStateColor,
  progressColor,
  trackerHealth,
  sortTorrentsByKey,
} from "@/lib/utils";
import { store } from "@/lib/store";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  FilterX,
  Columns3,
  CalendarDays,
  AlignJustify,
} from "lucide-react";
import type { DateFilter } from "@/hooks/use-dashboard-state";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

type ColAlign = "left" | "right";
type HideBelow = "sm" | "md" | "lg" | "xl";

interface ColDef {
  key: string;
  label: string;
  /** undefined = flex (name col) */
  defaultWidth?: number;
  minWidth: number;
  align?: ColAlign;
  hideBelow?: HideBelow;
  alwaysVisible?: boolean;
}

const ALL_COLUMNS: ColDef[] = [
  { key: "name",                  label: "Name",     minWidth: 100, alwaysVisible: true },
  { key: "size",                  label: "Size",     defaultWidth:  96, minWidth: 64, align: "right", hideBelow: "md" },
  { key: "progress",              label: "Progress", defaultWidth: 112, minWidth: 80, alwaysVisible: true },
  { key: "state",                 label: "Status",   defaultWidth:  96, minWidth: 72, hideBelow: "sm" },
  { key: "download_payload_rate", label: "Down",     defaultWidth:  88, minWidth: 64, align: "right", alwaysVisible: true },
  { key: "upload_payload_rate",   label: "Up",       defaultWidth:  88, minWidth: 64, align: "right", alwaysVisible: true },
  { key: "eta",                   label: "ETA",      defaultWidth:  80, minWidth: 56, align: "right", hideBelow: "md" },
  { key: "ratio",                 label: "Ratio",    defaultWidth:  64, minWidth: 48, align: "right", hideBelow: "md" },
  { key: "num_seeds",             label: "Seeds",    defaultWidth:  80, minWidth: 56, align: "right", hideBelow: "lg" },
  { key: "num_peers",             label: "Peers",    defaultWidth:  80, minWidth: 56, align: "right", hideBelow: "lg" },
  { key: "time_added",            label: "Added",    defaultWidth: 144, minWidth: 100, align: "right", hideBelow: "lg" },
];

// Hardcoded full strings — Tailwind JIT requires literal class names to generate CSS
const HEADER_VIS: Record<HideBelow, string> = {
  sm: "hidden sm:flex",
  md: "hidden md:flex",
  lg: "hidden lg:flex",
  xl: "hidden xl:flex",
};

/** Header cells are flex containers */
function getVisibilityClass(col: ColDef): string {
  if (col.alwaysVisible || !col.hideBelow) return "";
  return HEADER_VIS[col.hideBelow];
}

// Data cells use block so text-right alignment works
const CELL_VIS: Record<HideBelow, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
};

/** Data cells are block — text-right requires block display */
function getCellVisClass(col: ColDef): string {
  if (col.alwaysVisible || !col.hideBelow) return "";
  return CELL_VIS[col.hideBelow];
}

function getColStyle(col: ColDef, widths: Record<string, number>): React.CSSProperties {
  if (col.defaultWidth === undefined) {
    return { flex: 1, minWidth: col.minWidth };
  }
  return { width: widths[col.key] ?? col.defaultWidth, flexShrink: 0 };
}

// ---------------------------------------------------------------------------
// Density
// ---------------------------------------------------------------------------

const DENSITY_CONFIG = {
  compact:     { rowHeight: 32, py: "py-0.5" },
  default:     { rowHeight: 44, py: "py-2"   },
  comfortable: { rowHeight: 56, py: "py-3.5" },
} as const;
type Density = keyof typeof DENSITY_CONFIG;

const DENSITY_CYCLE: Density[] = ["compact", "default", "comfortable"];
const DENSITY_LABELS: Record<Density, string> = {
  compact: "Compact",
  default: "Default",
  comfortable: "Comfortable",
};

// ---------------------------------------------------------------------------
// Date filter
// ---------------------------------------------------------------------------

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all:   "All time",
  today: "Today",
  week:  "Last 7 days",
  month: "Last 30 days",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TorrentTableProps {
  torrents: (TorrentStatus & { hash: string })[];
  selectedHashes: Set<string>;
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
  onSelectAll: () => void;
  onAction: (action: string) => void;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  dateFilter?: DateFilter;
  onDateFilter?: (f: DateFilter) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TorrentTable({
  torrents,
  selectedHashes,
  onSelect,
  onSelectAll,
  onAction,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  dateFilter = "all",
  onDateFilter,
}: TorrentTableProps) {
  const [sortColumn, setSortColumn] = useState(store.getSortColumn());
  const [sortDir, setSortDir] = useState<"asc" | "desc">(store.getSortDirection());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(store.getSelectedColumns());
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [density, setDensityState] = useState<Density>(store.getDensity());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(store.getColumnWidths());
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const rowHeight = DENSITY_CONFIG[density].rowHeight;
  const rowPy = DENSITY_CONFIG[density].py;

  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => visibleColumns.includes(col.key)),
    [visibleColumns]
  );

  const sorted = useMemo(
    () => sortTorrentsByKey(torrents, sortColumn, sortDir),
    [torrents, sortColumn, sortDir]
  );

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
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      store.setSelectedColumns(next);
      return next;
    });
  }, []);

  function cycleDensity() {
    setDensityState((d) => {
      const next = DENSITY_CYCLE[(DENSITY_CYCLE.indexOf(d) + 1) % DENSITY_CYCLE.length];
      store.setDensity(next);
      return next;
    });
  }

  function startColumnResize(key: string, clientX: number) {
    const startWidth = columnWidths[key] ?? (ALL_COLUMNS.find((c) => c.key === key)?.defaultWidth ?? 96);
    resizingRef.current = { key, startX: clientX, startWidth };

    function onMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const { key: k, startX, startWidth: sw } = resizingRef.current;
      const minW = ALL_COLUMNS.find((c) => c.key === k)?.minWidth ?? 40;
      const next = Math.max(minW, sw + (e.clientX - startX));
      setColumnWidths((prev) => ({ ...prev, [k]: next }));
    }

    function onUp() {
      resizingRef.current = null;
      setColumnWidths((widths) => { store.setColumnWidths(widths); return widths; });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Keyboard: C → toggle column picker
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "c") { e.preventDefault(); setShowColumnPicker((v) => !v); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allSelected = torrents.length > 0 && selectedHashes.size === torrents.length;
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (selectedHashes.size !== 1) return;
    const hash = [...selectedHashes][0];
    const idx = sorted.findIndex((t) => t.hash === hash);
    if (idx >= 0) virtualizer.scrollToIndex(idx, { align: "auto" });
  }, [selectedHashes]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex shrink-0 items-stretch border-b bg-muted/50 text-xs font-medium text-muted-foreground select-none">
        {/* Checkbox */}
        <div className="flex w-7 shrink-0 items-center justify-center px-1">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
            className="h-3.5 w-3.5"
            title="Select All (Ctrl+A)"
          />
        </div>
        {/* Column headers */}
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              "relative flex items-center",
              col.align === "right" && "justify-end",
              getVisibilityClass(col)
            )}
            style={getColStyle(col, columnWidths)}
          >
            <button
              onClick={() => handleSort(col.key)}
              className="flex w-full items-center gap-0.5 px-2 py-2 hover:text-foreground transition-colors whitespace-nowrap overflow-hidden"
              style={col.align === "right" ? { justifyContent: "flex-end" } : {}}
            >
              <span className="truncate">{col.label}</span>
              {sortColumn === col.key && (
                sortDir === "asc"
                  ? <ArrowUp className="h-3 w-3 shrink-0" />
                  : <ArrowDown className="h-3 w-3 shrink-0" />
              )}
            </button>
            {/* Resize handle — only for fixed-width columns */}
            {col.defaultWidth !== undefined && (
              <div
                className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-ring/60"
                onMouseDown={(e) => { e.preventDefault(); startColumnResize(col.key, e.clientX); }}
              />
            )}
          </div>
        ))}
        {/* Toolbar: fixed width so Name flex-1 is same width as in data rows */}
        <div className="w-[80px] shrink-0 flex items-center justify-end gap-0.5 px-1">
          <button
            onClick={cycleDensity}
            className="p-1 hover:text-foreground transition-colors"
            title={`Density: ${DENSITY_LABELS[density]}`}
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          {onDateFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "p-1 hover:text-foreground transition-colors",
                  dateFilter !== "all" && "text-brand"
                )}
                title={`Date filter: ${DATE_FILTER_LABELS[dateFilter]}`}
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

          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="p-1 hover:text-foreground transition-colors"
              title="Column visibility (C)"
            >
              <Columns3 className="h-3.5 w-3.5" />
            </button>
            {showColumnPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border bg-popover p-2 shadow-md">
                  {ALL_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 py-1 text-xs cursor-pointer select-none hover:text-foreground">
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
      </div>

      {/* Rows */}
      <div
        className="flex-1 min-h-0 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25"
        ref={scrollRef}
      >
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center border-b px-3 py-3">
                <div className="w-7 shrink-0" />
                <div className="flex-1 px-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
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
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualItems.map((virtualRow) => {
              const torrent = sorted[virtualRow.index];
              return (
                <div
                  key={torrent.hash}
                  className="absolute left-0 w-full"
                  style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                >
                  <ContextMenu
                    content={<TorrentContextMenuContent torrent={torrent} onAction={onAction} />}
                  >
                    <TorrentRow
                      torrent={torrent}
                      selected={selectedHashes.has(torrent.hash)}
                      columns={columns}
                      columnWidths={columnWidths}
                      rowPy={rowPy}
                      onSelect={onSelect}
                    />
                  </ContextMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Context menu
// ---------------------------------------------------------------------------

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
      <ContextMenuItem onClick={() => onAction("set_label")}>Set Label…</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("move_storage")}>Move Storage…</ContextMenuItem>
      <ContextMenuItem onClick={() => onAction("generate_nfo")}>Generate NFO</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive onClick={() => onAction("remove")}>Remove</ContextMenuItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function TorrentRow({
  torrent,
  selected,
  columns,
  columnWidths,
  rowPy,
  onSelect,
}: {
  torrent: TorrentStatus & { hash: string };
  selected: boolean;
  columns: ColDef[];
  columnWidths: Record<string, number>;
  rowPy: string;
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
}) {
  return (
    <div
      onClick={(e) => onSelect(torrent.hash, e.ctrlKey || e.metaKey, e.shiftKey)}
      className={cn(
        "flex items-center border-b text-sm cursor-pointer transition-colors h-full",
        selected ? "bg-accent/80 text-accent-foreground" : "hover:bg-muted/50"
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
        <TorrentCell key={col.key} col={col} torrent={torrent} columnWidths={columnWidths} rowPy={rowPy} />
      ))}
      {/* Spacer matching header toolbar width so columns stay aligned */}
      <div className="w-[80px] shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cell
// ---------------------------------------------------------------------------

function TorrentCell({
  col,
  torrent,
  columnWidths,
  rowPy,
}: {
  col: ColDef;
  torrent: TorrentStatus & { hash: string };
  columnWidths: Record<string, number>;
  rowPy: string;
}) {
  const style = getColStyle(col, columnWidths);
  const vis = getCellVisClass(col);
  const base = cn("overflow-hidden px-2", rowPy, vis, col.align === "right" && "text-right");

  switch (col.key) {
    case "name": {
      const health = trackerHealth(torrent.message);
      return (
        <div className={cn(base, "flex items-center gap-1.5")} style={style}>
          {health === "error" && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-state-error"
              title={torrent.message}
            />
          )}
          <span className="truncate text-sm">{torrent.name}</span>
        </div>
      );
    }
    case "size":
      return <div className={cn(base, "text-xs text-muted-foreground")} style={style}>{formatBytes(torrent.total_size)}</div>;
    case "progress":
      return (
        <div className={cn(base)} style={style}>
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
      return (
        <div className={cn(base, "text-xs font-medium", torrentStateColor(torrent.state))} style={style}>
          {torrent.state}
        </div>
      );
    case "download_payload_rate":
      return (
        <div className={cn(base, "text-xs")} style={style}>
          {torrent.download_payload_rate > 0
            ? <span className="text-dl">{formatSpeed(torrent.download_payload_rate)}</span>
            : <span className="text-muted-foreground">—</span>}
        </div>
      );
    case "upload_payload_rate":
      return (
        <div className={cn(base, "text-xs")} style={style}>
          {torrent.upload_payload_rate > 0
            ? <span className="text-ul">{formatSpeed(torrent.upload_payload_rate)}</span>
            : <span className="text-muted-foreground">—</span>}
        </div>
      );
    case "eta":
      return <div className={cn(base, "text-xs text-muted-foreground")} style={style}>{torrent.eta > 0 ? formatETA(torrent.eta) : "—"}</div>;
    case "ratio":
      return <div className={cn(base, "text-xs font-medium", ratioColor(torrent.ratio))} style={style}>{formatRatio(torrent.ratio)}</div>;
    case "num_seeds":
      return <div className={cn(base, "text-xs text-muted-foreground")} style={style}>{torrent.num_seeds} ({torrent.total_seeds})</div>;
    case "num_peers":
      return <div className={cn(base, "text-xs text-muted-foreground")} style={style}>{torrent.num_peers} ({torrent.total_peers})</div>;
    case "time_added":
      return <div className={cn(base, "text-xs text-muted-foreground")} style={style}>{formatDate(torrent.time_added)}</div>;
    default:
      return null;
  }
}
