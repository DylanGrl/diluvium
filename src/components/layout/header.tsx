import type { UpdateUIResult } from "@/api/types";
import { formatSpeed, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Settings,
  Droplets,
  HardDrive,
} from "lucide-react";

interface HeaderProps {
  stats?: UpdateUIResult["stats"];
  onAddTorrent: () => void;
  onOpenSettings: () => void;
}

export function Header({ stats, onAddTorrent, onOpenSettings }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          <Droplets className="h-5 w-5 text-blue-500" />
          Diluvium
        </div>
      </div>

      <div className="flex items-center gap-4">
        {stats && (
          <>
            <div className="flex items-center gap-1.5 text-sm">
              <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-blue-500 font-medium">
                {formatSpeed(stats.download_rate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <ArrowUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500 font-medium">
                {formatSpeed(stats.upload_rate)}
              </span>
            </div>
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <HardDrive className="h-3.5 w-3.5" />
              {formatBytes(stats.free_space)}
            </div>
            <div className="hidden text-xs text-muted-foreground md:block">
              DHT: {stats.dht_nodes}
            </div>
          </>
        )}

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onAddTorrent} title="Add Torrent (A)">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenSettings} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
