import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TorrentStatus } from "@/api/types";
import { cn, formatBytes, formatSpeed, torrentStateColor, progressColor } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Search, FilterX } from "lucide-react";

const CARD_HEIGHT_PX = 80;

interface TorrentCardListProps {
  torrents: (TorrentStatus & { hash: string })[];
  selectedHashes: Set<string>;
  onSelect: (hash: string, multi: boolean, shift?: boolean) => void;
  onAction: (action: string) => void;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function TorrentCardList({
  torrents,
  selectedHashes,
  onSelect,
  onAction,
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: TorrentCardListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: torrents.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT_PX,
    overscan: 5,
  });

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
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto px-3 py-2"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const torrent = torrents[virtualRow.index];
          const selected = selectedHashes.has(torrent.hash);
          return (
            <div
              key={torrent.hash}
              className="absolute left-0 w-full px-0 pb-2"
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

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 h-[72px] cursor-pointer transition-colors",
        selected
          ? "bg-accent ring-1 ring-ring"
          : "hover:bg-muted/50"
      )}
      onClick={() => onSelect(torrent.hash, false)}
    >
      {/* State dot */}
      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full bg-current", stateColor)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{torrent.name}</p>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.min(torrent.progress, 100)}%` }}
          />
        </div>
        {/* Stats row */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>↓ {formatSpeed(torrent.download_payload_rate)}</span>
          <span>↑ {formatSpeed(torrent.upload_payload_rate)}</span>
          <span className="ml-auto">{formatBytes(torrent.total_size)}</span>
        </div>
      </div>

      {/* Action menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="shrink-0 rounded p-1 opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
          onClick={(e) => e.stopPropagation()}
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
  );
}
