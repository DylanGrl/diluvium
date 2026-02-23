import { useState } from "react";
import type { UpdateUIResult } from "@/api/types";
import type { SessionStats } from "@/hooks/use-session-stats";
import { formatSpeed, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Settings,
  Droplets,
  HardDrive,
  Menu,
  Search,
  X,
  Globe,
  Zap,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  stats?: UpdateUIResult["stats"];
  sessionStats?: SessionStats;
  isConnected: boolean;
  externalIP?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddTorrent: () => void;
  onOpenSettings: () => void;
  onOpenMobileSidebar: () => void;
  onQuickAction?: (action: string) => void;
}

function NetworkInfoButton({
  stats,
  externalIP,
  sessionStats,
  isConnected,
}: Pick<HeaderProps, "stats" | "externalIP" | "sessionStats" | "isConnected">) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent transition-colors"
        title="Network stats"
      >
        {/* Connection dot — always visible */}
        <div
          className={`h-2 w-2 shrink-0 rounded-full ${
            isConnected ? "bg-ul" : "bg-state-error"
          }`}
        />
        {/* Speeds — visible on sm+ */}
        {stats && (
          <span className="hidden sm:flex items-center gap-2">
            <span className="flex items-center gap-1">
              <ArrowDown className="h-3.5 w-3.5 text-dl" />
              <span className="text-dl font-medium">{formatSpeed(stats.download_rate)}</span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3.5 w-3.5 text-ul" />
              <span className="text-ul font-medium">{formatSpeed(stats.upload_rate)}</span>
            </span>
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[210px] rounded-md border bg-popover p-3 shadow-lg space-y-1.5 text-xs">
            {/* Connection status */}
            <div className="flex items-center justify-between gap-6">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  isConnected ? "text-ul" : "text-state-error"
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    isConnected ? "bg-ul" : "bg-state-error"
                  }`}
                />
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {externalIP && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  IP
                </span>
                <span className="font-mono">{externalIP}</span>
              </div>
            )}

            {stats && (
              <>
                <div className="border-t pt-1.5 mt-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowDown className="h-3 w-3 text-dl" />
                      Download
                    </span>
                    <span className="text-dl font-medium">
                      {formatSpeed(stats.download_rate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-ul" />
                      Upload
                    </span>
                    <span className="text-ul font-medium">
                      {formatSpeed(stats.upload_rate)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-1.5 mt-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      Free space
                    </span>
                    <span>{formatBytes(stats.free_space)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">DHT nodes</span>
                    <span>{stats.dht_nodes}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground">Incoming</span>
                    <span
                      className={
                        stats.has_incoming_connections
                          ? "text-ul"
                          : "text-muted-foreground"
                      }
                    >
                      {stats.has_incoming_connections ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {sessionStats &&
              (sessionStats.totalDownloaded > 0 ||
                sessionStats.totalUploaded > 0) && (
                <div className="border-t pt-1.5 mt-1 space-y-1.5">
                  <p className="text-muted-foreground font-medium">Session</p>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowDown className="h-3 w-3 text-dl" />
                      Downloaded
                    </span>
                    <span>{formatBytes(sessionStats.totalDownloaded)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-ul" />
                      Uploaded
                    </span>
                    <span>{formatBytes(sessionStats.totalUploaded)}</span>
                  </div>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
}

export function Header({
  stats,
  sessionStats,
  isConnected,
  externalIP,
  searchQuery,
  onSearchChange,
  onAddTorrent,
  onOpenSettings,
  onOpenMobileSidebar,
  onQuickAction,
}: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-3 gap-2">
      {/* Left: mobile menu + logo */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          <Droplets className="h-5 w-5 text-brand" />
          <span className="hidden sm:inline">Diluvium</span>
        </div>
      </div>

      {/* Middle: search */}
      <div className="relative flex-1 min-w-0 mx-2 sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="torrent-search"
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 pr-8 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right: network stats + actions */}
      <div className="flex items-center gap-1">
        <NetworkInfoButton
          stats={stats}
          externalIP={externalIP}
          sessionStats={sessionStats}
          isConnected={isConnected}
        />

        {onQuickAction && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              title="Quick actions"
              disabled={!isConnected}
            >
              <Zap className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onQuickAction("pause_all")}>
                Pause all
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQuickAction("resume_all")}>
                Resume all
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQuickAction("pause_all_completed")}
              >
                Pause all completed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQuickAction("resume_all_paused")}
              >
                Resume all paused
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onQuickAction("remove_ratio_above")}
              >
                Remove all with ratio above…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onAddTorrent}
          title="Add Torrent (A)"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
