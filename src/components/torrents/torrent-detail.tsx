import { useState } from "react";
import type { TorrentStatus } from "@/api/types";
import { useTorrentFiles, useTorrentPeers } from "@/api/hooks";
import { formatBytes, formatSpeed, formatDate, formatETA, formatRatio, cn, progressColor } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Peer } from "@/api/types";

interface TorrentDetailProps {
  hash: string;
  torrent: TorrentStatus;
  onClose: () => void;
}

export function TorrentDetail({ hash, torrent, onClose }: TorrentDetailProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="shrink-0 border-t bg-card" style={{ height: 280 }}>
      <div className="flex items-center justify-between border-b px-4 py-1.5">
        <h3 className="truncate text-sm font-medium">{torrent.name}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-4 mt-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="peers">Peers</TabsTrigger>
          <TabsTrigger value="trackers">Trackers</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>
        <div className="h-[200px] overflow-hidden">
          <TabsContent value="general">
            <GeneralTab torrent={torrent} />
          </TabsContent>
          <TabsContent value="files">
            <FilesTab hash={hash} />
          </TabsContent>
          <TabsContent value="peers">
            <PeersTab hash={hash} />
          </TabsContent>
          <TabsContent value="trackers">
            <TrackersTab torrent={torrent} />
          </TabsContent>
          <TabsContent value="options">
            <OptionsTab torrent={torrent} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function GeneralTab({ torrent }: { torrent: TorrentStatus }) {
  const items = [
    ["Progress", `${torrent.progress.toFixed(1)}% (${formatBytes(torrent.total_done)} / ${formatBytes(torrent.total_size)})`],
    ["Download Speed", formatSpeed(torrent.download_payload_rate)],
    ["Upload Speed", formatSpeed(torrent.upload_payload_rate)],
    ["ETA", formatETA(torrent.eta)],
    ["Ratio", formatRatio(torrent.ratio)],
    ["Seeds", `${torrent.num_seeds} (${torrent.total_seeds})`],
    ["Peers", `${torrent.num_peers} (${torrent.total_peers})`],
    ["Total Uploaded", formatBytes(torrent.total_uploaded)],
    ["Save Path", torrent.save_path],
    ["Added", formatDate(torrent.time_added)],
    ["Tracker", torrent.tracker_host],
    ["Comment", torrent.comment || "—"],
    ["Message", torrent.message || "—"],
  ];

  return (
    <ScrollArea className="h-[200px] px-4 py-2">
      <div className="mb-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", progressColor(torrent.progress, torrent.state))}
            style={{ width: `${Math.min(torrent.progress, 100)}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="truncate text-right">{value}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function flattenFiles(data: unknown): { path: string; size: number; progress: number; priority: number }[] {
  if (!data || typeof data !== "object") return [];
  const contents = (data as Record<string, unknown>).contents;
  if (!contents || typeof contents !== "object") return [];

  const results: { path: string; size: number; progress: number; priority: number }[] = [];

  function walk(node: unknown, path: string) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "file") {
      results.push({
        path,
        size: (n.size as number) ?? 0,
        progress: (n.progress as number) ?? 0,
        priority: (n.priority as number) ?? 1,
      });
    } else if (n.contents && typeof n.contents === "object") {
      const children = n.contents as Record<string, unknown>;
      for (const [name, child] of Object.entries(children)) {
        walk(child, path ? `${path}/${name}` : name);
      }
    }
  }

  const c = contents as Record<string, unknown>;
  for (const [name, child] of Object.entries(c)) {
    walk(child, name);
  }
  return results;
}

function FilesTab({ hash }: { hash: string }) {
  const { data, isLoading } = useTorrentFiles(hash);

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Loading...</div>;

  const files = flattenFiles(data);

  return (
    <ScrollArea className="h-[200px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-4 py-1.5 text-left font-medium">File</th>
            <th className="px-2 py-1.5 text-right font-medium w-20">Size</th>
            <th className="px-2 py-1.5 text-right font-medium w-20">Progress</th>
            <th className="px-2 py-1.5 text-right font-medium w-16">Priority</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.path} className="border-b border-border/50">
              <td className="px-4 py-1 truncate max-w-[300px]">{file.path}</td>
              <td className="px-2 py-1 text-right text-muted-foreground">{formatBytes(file.size)}</td>
              <td className="px-2 py-1 text-right">{(file.progress * 100).toFixed(1)}%</td>
              <td className="px-2 py-1 text-right text-muted-foreground">
                {file.priority === 0 ? "Skip" : file.priority === 1 ? "Normal" : "High"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function PeersTab({ hash }: { hash: string }) {
  const { data, isLoading } = useTorrentPeers(hash);

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Loading...</div>;

  const peers: Peer[] = data?.peers ?? [];

  return (
    <ScrollArea className="h-[200px]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-4 py-1.5 text-left font-medium">IP</th>
            <th className="px-2 py-1.5 text-left font-medium">Client</th>
            <th className="px-2 py-1.5 text-right font-medium w-20">Down</th>
            <th className="px-2 py-1.5 text-right font-medium w-20">Up</th>
            <th className="px-2 py-1.5 text-right font-medium w-16">Progress</th>
          </tr>
        </thead>
        <tbody>
          {peers.map((peer) => (
            <tr key={peer.ip} className="border-b border-border/50">
              <td className="px-4 py-1 font-mono">{peer.ip}</td>
              <td className="px-2 py-1 truncate max-w-[150px]">{peer.client}</td>
              <td className="px-2 py-1 text-right">{formatSpeed(peer.down_speed)}</td>
              <td className="px-2 py-1 text-right">{formatSpeed(peer.up_speed)}</td>
              <td className="px-2 py-1 text-right">{(peer.progress * 100).toFixed(0)}%</td>
            </tr>
          ))}
          {peers.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No peers</td></tr>
          )}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function TrackersTab({ torrent }: { torrent: TorrentStatus }) {
  return (
    <ScrollArea className="h-[200px] px-4 py-2">
      <div className="text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tracker</span>
          <span>{torrent.tracker_host || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Message</span>
          <span>{torrent.message || "—"}</span>
        </div>
      </div>
    </ScrollArea>
  );
}

function OptionsTab({ torrent }: { torrent: TorrentStatus }) {
  const items = [
    ["Max Download Speed", torrent.max_download_speed < 0 ? "Unlimited" : `${torrent.max_download_speed} KiB/s`],
    ["Max Upload Speed", torrent.max_upload_speed < 0 ? "Unlimited" : `${torrent.max_upload_speed} KiB/s`],
    ["Max Connections", torrent.max_connections < 0 ? "Unlimited" : String(torrent.max_connections)],
    ["Max Upload Slots", torrent.max_upload_slots < 0 ? "Unlimited" : String(torrent.max_upload_slots)],
    ["Auto Managed", torrent.is_auto_managed ? "Yes" : "No"],
    ["Queue Position", String(torrent.queue)],
  ];

  return (
    <ScrollArea className="h-[200px] px-4 py-2">
      <div className="space-y-1 text-xs">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
