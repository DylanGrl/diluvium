import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { cn, formatBytes, formatRatio, ratioColor } from "@/lib/utils";
import type { TorrentStatus } from "@/api/types";

interface RatioStatsProps {
  torrents: (TorrentStatus & { hash: string })[];
}

export function RatioStats({ torrents }: RatioStatsProps) {
  const [open, setOpen] = useState(false);

  const { globalRatio, globalUp, globalDown, perTracker } = useMemo(() => {
    let totalUp = 0;
    let totalDown = 0;
    const trackerMap = new Map<string, { up: number; down: number; count: number }>();

    for (const t of torrents) {
      const up = t.total_uploaded ?? 0;
      const down = t.total_done ?? 0;
      totalUp += up;
      totalDown += down;
      const host = t.tracker_host || "No tracker";
      const entry = trackerMap.get(host) ?? { up: 0, down: 0, count: 0 };
      entry.up += up;
      entry.down += down;
      entry.count += 1;
      trackerMap.set(host, entry);
    }

    const globalRatio = totalDown > 0 ? totalUp / totalDown : -1;
    const perTracker = Array.from(trackerMap.entries())
      .map(([host, v]) => ({
        host,
        up: v.up,
        down: v.down,
        count: v.count,
        ratio: v.down > 0 ? v.up / v.down : -1,
      }))
      .sort((a, b) => b.count - a.count);

    return { globalRatio, globalUp: totalUp, globalDown: totalDown, perTracker };
  }, [torrents]);

  if (torrents.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5" />
          Statistics
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Always-visible summary row */}
      {!open && (
        <div className="flex items-center gap-2 px-2 pb-2 text-xs text-muted-foreground">
          <span>↑ {formatBytes(globalUp)}</span>
          <span>↓ {formatBytes(globalDown)}</span>
          <span className={cn("font-medium ml-auto", ratioColor(globalRatio))}>R {formatRatio(globalRatio)}</span>
        </div>
      )}

      {open && (
        <div className="px-2 pb-3 space-y-2">
          {/* Global */}
          <div className="rounded-md border bg-muted/30 px-3 py-2 space-y-1">
            <p className="text-xs font-medium mb-1">Global</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>↑ {formatBytes(globalUp)}</span>
              <span>↓ {formatBytes(globalDown)}</span>
              <span className={cn("font-medium", ratioColor(globalRatio))}>
                R {formatRatio(globalRatio)}
              </span>
            </div>
          </div>

          {/* Per tracker */}
          {perTracker.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground px-1 mb-1">Per tracker</p>
              {perTracker.map(({ host, up, down, ratio, count }) => (
                <div key={host} className="rounded px-2 py-1 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="flex-1 truncate text-muted-foreground">{host}</span>
                    <span className="shrink-0 text-muted-foreground/60">{count}</span>
                    <span className={cn("shrink-0 font-medium w-10 text-right", ratioColor(ratio))}>
                      {formatRatio(ratio)}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-muted-foreground/70 mt-0.5">
                    <span>↑ {formatBytes(up)}</span>
                    <span>↓ {formatBytes(down)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
