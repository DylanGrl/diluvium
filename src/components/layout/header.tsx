import type { UpdateUIResult } from "@/api/types";
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
} from "lucide-react";

interface HeaderProps {
  stats?: UpdateUIResult["stats"];
  isConnected: boolean;
  externalIP?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddTorrent: () => void;
  onOpenSettings: () => void;
  onOpenMobileSidebar: () => void;
  onQuickAction?: (action: string) => void;
}

export function Header({
  stats,
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
      <div className="flex items-center gap-2">
        {/* Mobile menu button */}
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

        {/* Connection indicator */}
        <div
          className={`h-2 w-2 rounded-full ${isConnected ? "bg-ul" : "bg-state-error"}`}
          title={isConnected ? "Connected" : "Disconnected"}
        />
      </div>

      {/* Search bar */}
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

      <div className="flex items-center gap-2">
        {stats && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <ArrowDown className="h-3.5 w-3.5 text-dl" />
              <span className="text-dl font-medium">
                {formatSpeed(stats.download_rate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <ArrowUp className="h-3.5 w-3.5 text-ul" />
              <span className="text-ul font-medium">
                {formatSpeed(stats.upload_rate)}
              </span>
            </div>
            {externalIP && (
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex" title="External IP">
                <Globe className="h-3.5 w-3.5" />
                {externalIP}
              </div>
            )}
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <HardDrive className="h-3.5 w-3.5" />
              {formatBytes(stats.free_space)}
            </div>
            <div className="hidden text-xs text-muted-foreground lg:block">
              DHT: {stats.dht_nodes}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
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
                <DropdownMenuItem onClick={() => onQuickAction("pause_all_completed")}>
                  Pause all completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onQuickAction("resume_all_paused")}>
                  Resume all paused
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onQuickAction("remove_ratio_above")}>
                  Remove all with ratio above…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddTorrent} title="Add Torrent (A)">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
