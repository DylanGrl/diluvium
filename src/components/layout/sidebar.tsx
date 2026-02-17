import type { UpdateUIResult, FilterState } from "@/api/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  Pause,
  CircleCheck,
  AlertCircle,
  List,
  Activity,
  Clock,
} from "lucide-react";

interface SidebarProps {
  filters?: UpdateUIResult["filters"];
  stateFilter: FilterState;
  trackerFilter: string;
  labelFilter: string;
  onStateFilter: (s: FilterState) => void;
  onTrackerFilter: (s: string) => void;
  onLabelFilter: (s: string) => void;
}

const stateIcons: Record<string, React.ReactNode> = {
  All: <List className="h-4 w-4" />,
  Downloading: <Download className="h-4 w-4 text-blue-500" />,
  Seeding: <Upload className="h-4 w-4 text-green-500" />,
  Paused: <Pause className="h-4 w-4 text-yellow-500" />,
  Checking: <CircleCheck className="h-4 w-4 text-purple-500" />,
  Error: <AlertCircle className="h-4 w-4 text-red-500" />,
  Active: <Activity className="h-4 w-4 text-blue-400" />,
  Queued: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export function Sidebar({
  filters,
  stateFilter,
  trackerFilter,
  labelFilter,
  onStateFilter,
  onTrackerFilter,
  onLabelFilter,
}: SidebarProps) {
  const stateFilters = filters?.state ?? [["All", 0]];
  const trackerFilters = filters?.tracker_host ?? [];
  const labelFilters = filters?.label ?? [];

  return (
    <aside className="hidden w-52 shrink-0 border-r bg-sidebar-background md:block">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-4">
          <div>
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              State
            </h3>
            <div className="space-y-0.5">
              {stateFilters.map(([state, count]) => (
                <button
                  key={state}
                  onClick={() => onStateFilter(state as FilterState)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    stateFilter === state
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {stateIcons[state] ?? <List className="h-4 w-4" />}
                  <span className="flex-1 text-left">{state}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {trackerFilters.length > 0 && (
            <div>
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tracker
              </h3>
              <div className="space-y-0.5">
                {trackerFilters.map(([tracker, count]) => (
                  <button
                    key={tracker}
                    onClick={() => onTrackerFilter(tracker)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      trackerFilter === tracker
                        ? "bg-accent text-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <span className="flex-1 truncate text-left">
                      {tracker || "No tracker"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {labelFilters.length > 0 && (
            <div>
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Label
              </h3>
              <div className="space-y-0.5">
                {labelFilters.map(([label, count]) => (
                  <button
                    key={label}
                    onClick={() => onLabelFilter(label)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      labelFilter === label
                        ? "bg-accent text-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <span className="flex-1 truncate text-left">
                      {label || "No label"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
