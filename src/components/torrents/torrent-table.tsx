import { useState, useMemo } from "react";
import type { TorrentStatus } from "@/api/types";
import { cn, formatBytes, formatSpeed, formatETA, formatRatio, torrentStateColor, progressColor } from "@/lib/utils";
import { store } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TorrentTableProps {
  torrents: (TorrentStatus & { hash: string })[];
  selectedHashes: Set<string>;
  onSelect: (hash: string, multi: boolean) => void;
}

type SortDir = "asc" | "desc";

const COLUMNS = [
  { key: "name", label: "Name", className: "flex-[3] min-w-[200px]" },
  { key: "size", label: "Size", className: "w-24 text-right" },
  { key: "progress", label: "Progress", className: "w-32" },
  { key: "state", label: "Status", className: "w-24" },
  { key: "download_payload_rate", label: "Down", className: "w-24 text-right" },
  { key: "upload_payload_rate", label: "Up", className: "w-24 text-right" },
  { key: "eta", label: "ETA", className: "w-20 text-right" },
  { key: "ratio", label: "Ratio", className: "w-16 text-right" },
  { key: "num_seeds", label: "Seeds", className: "w-20 text-right" },
  { key: "num_peers", label: "Peers", className: "w-20 text-right" },
] as const;

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

export function TorrentTable({ torrents, selectedHashes, onSelect }: TorrentTableProps) {
  const [sortColumn, setSortColumn] = useState(store.getSortColumn());
  const [sortDir, setSortDir] = useState<SortDir>(store.getSortDirection());

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center border-b bg-muted/50 px-3 text-xs font-medium text-muted-foreground">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={cn(
              "flex items-center gap-1 px-2 py-2 hover:text-foreground transition-colors",
              col.className
            )}
          >
            {col.label}
            {sortColumn === col.key && (
              sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      <ScrollArea className="flex-1">
        {sorted.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No torrents
          </div>
        ) : (
          sorted.map((torrent) => (
            <TorrentRow
              key={torrent.hash}
              torrent={torrent}
              selected={selectedHashes.has(torrent.hash)}
              onSelect={onSelect}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}

function TorrentRow({
  torrent,
  selected,
  onSelect,
}: {
  torrent: TorrentStatus & { hash: string };
  selected: boolean;
  onSelect: (hash: string, multi: boolean) => void;
}) {
  return (
    <div
      onClick={(e) => onSelect(torrent.hash, e.ctrlKey || e.metaKey)}
      className={cn(
        "flex items-center border-b px-3 text-sm cursor-pointer transition-colors",
        selected
          ? "bg-accent/80 text-accent-foreground"
          : "hover:bg-muted/50"
      )}
    >
      {/* Name */}
      <div className="flex-[3] min-w-[200px] truncate px-2 py-2">
        {torrent.name}
      </div>

      {/* Size */}
      <div className="w-24 px-2 py-2 text-right text-xs text-muted-foreground">
        {formatBytes(torrent.total_size)}
      </div>

      {/* Progress */}
      <div className="w-32 px-2 py-2">
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

      {/* State */}
      <div className={cn("w-24 px-2 py-2 text-xs font-medium", torrentStateColor(torrent.state))}>
        {torrent.state}
      </div>

      {/* Down speed */}
      <div className="w-24 px-2 py-2 text-right text-xs">
        {torrent.download_payload_rate > 0 ? (
          <span className="text-blue-500">{formatSpeed(torrent.download_payload_rate)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* Up speed */}
      <div className="w-24 px-2 py-2 text-right text-xs">
        {torrent.upload_payload_rate > 0 ? (
          <span className="text-green-500">{formatSpeed(torrent.upload_payload_rate)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* ETA */}
      <div className="w-20 px-2 py-2 text-right text-xs text-muted-foreground">
        {torrent.eta > 0 ? formatETA(torrent.eta) : "—"}
      </div>

      {/* Ratio */}
      <div className="w-16 px-2 py-2 text-right text-xs text-muted-foreground">
        {formatRatio(torrent.ratio)}
      </div>

      {/* Seeds */}
      <div className="w-20 px-2 py-2 text-right text-xs text-muted-foreground">
        {torrent.num_seeds} ({torrent.total_seeds})
      </div>

      {/* Peers */}
      <div className="w-20 px-2 py-2 text-right text-xs text-muted-foreground">
        {torrent.num_peers} ({torrent.total_peers})
      </div>
    </div>
  );
}
