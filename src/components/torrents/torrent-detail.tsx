import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import type { TorrentStatus, Peer } from "@/api/types";
import { useTorrentFiles, useTorrentPeers, useTorrentActions } from "@/api/hooks";
import { formatBytes, formatSpeed, formatDate, formatETA, formatRatio, cn, progressColor } from "@/lib/utils";
import { store } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectOption } from "@/components/ui/select";
import { X, GripHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LazySpeedGraphTab = lazy(() =>
  import("./speed-graph-tab").then((m) => ({ default: m.SpeedGraphTab }))
);

interface TorrentDetailProps {
  hash: string;
  torrent: TorrentStatus;
  onClose: () => void;
}

// Country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const c = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(c).map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
  );
}

export function TorrentDetail({ hash, torrent, onClose }: TorrentDetailProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [panelHeight, setPanelHeight] = useState(store.getDetailPanelHeight());
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = panelHeight;

    function onMouseMove(ev: MouseEvent) {
      if (!draggingRef.current) return;
      const delta = startYRef.current - ev.clientY;
      const next = Math.max(150, Math.min(600, startHeightRef.current + delta));
      setPanelHeight(next);
    }

    function onMouseUp() {
      if (draggingRef.current) {
        draggingRef.current = false;
        // Persist on release
        setPanelHeight((h) => {
          store.setDetailPanelHeight(h);
          return h;
        });
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [panelHeight]);

  const contentHeight = panelHeight - 80; // header + tabs

  return (
    <div className="shrink-0 border-t bg-card flex flex-col" style={{ height: panelHeight }}>
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="flex h-3 shrink-0 cursor-row-resize items-center justify-center hover:bg-muted/50"
      >
        <GripHorizontal className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between border-b px-4 py-1.5">
        <h3 className="truncate text-sm font-medium">{torrent.name}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-4 mt-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="speed">Speed</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="peers">Peers</TabsTrigger>
          <TabsTrigger value="trackers">Trackers</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden" style={{ height: contentHeight }}>
          <TabsContent value="general">
            <GeneralTab torrent={torrent} contentHeight={contentHeight} />
          </TabsContent>
          <TabsContent value="speed">
            <Suspense fallback={<div className="flex items-center justify-center" style={{ height: contentHeight }}><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
              <LazySpeedGraphTab torrent={torrent} contentHeight={contentHeight} />
            </Suspense>
          </TabsContent>
          <TabsContent value="files">
            <FilesTab hash={hash} contentHeight={contentHeight} />
          </TabsContent>
          <TabsContent value="peers">
            <PeersTab hash={hash} contentHeight={contentHeight} />
          </TabsContent>
          <TabsContent value="trackers">
            <TrackersTab torrent={torrent} contentHeight={contentHeight} />
          </TabsContent>
          <TabsContent value="options">
            <OptionsTab hash={hash} torrent={torrent} contentHeight={contentHeight} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function GeneralTab({ torrent, contentHeight }: { torrent: TorrentStatus; contentHeight: number }) {
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
    <ScrollArea style={{ height: contentHeight }} className="px-4 py-2">
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

function flattenFiles(data: unknown): { path: string; size: number; progress: number; priority: number; index: number }[] {
  if (!data || typeof data !== "object") return [];
  const contents = (data as Record<string, unknown>).contents;
  if (!contents || typeof contents !== "object") return [];

  const results: { path: string; size: number; progress: number; priority: number; index: number }[] = [];
  let idx = 0;

  function walk(node: unknown, path: string) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "file") {
      results.push({
        path,
        size: (n.size as number) ?? 0,
        progress: (n.progress as number) ?? 0,
        priority: (n.priority as number) ?? 1,
        index: (n.index as number) ?? idx,
      });
      idx++;
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

const PRIORITY_OPTIONS = [
  { value: "0", label: "Skip" },
  { value: "1", label: "Normal" },
  { value: "5", label: "High" },
  { value: "7", label: "Highest" },
];

function FilesTab({ hash, contentHeight }: { hash: string; contentHeight: number }) {
  const { data, isLoading } = useTorrentFiles(hash);
  const { setFilePrioritiesMutation } = useTorrentActions();

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Loading...</div>;

  const files = flattenFiles(data);

  async function handlePriorityChange(fileIndex: number, newPriority: number) {
    const priorities = files.map((f) =>
      f.index === fileIndex ? newPriority : f.priority
    );
    try {
      await setFilePrioritiesMutation.mutateAsync({ hash, priorities });
    } catch (err) {
      toast.error(`Failed to set priority: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleSetAllPriority(priority: number) {
    const priorities = files.map(() => priority);
    try {
      await setFilePrioritiesMutation.mutateAsync({ hash, priorities });
      toast.success(`All files set to ${PRIORITY_OPTIONS.find((p) => p.value === String(priority))?.label}`);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <div style={{ height: contentHeight }} className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-1 border-b">
        <span className="text-xs text-muted-foreground">Set all:</span>
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSetAllPriority(parseInt(opt.value))}
            className="text-xs text-link hover:underline"
          >
            {opt.label}
          </button>
        ))}
      </div>
      <ScrollArea className="flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-1.5 text-left font-medium">File</th>
              <th className="px-2 py-1.5 text-right font-medium w-20">Size</th>
              <th className="px-2 py-1.5 text-right font-medium w-20">Progress</th>
              <th className="px-2 py-1.5 text-right font-medium w-28">Priority</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.path} className="border-b border-border/50">
                <td className="px-4 py-1 truncate max-w-[300px]">{file.path}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{formatBytes(file.size)}</td>
                <td className="px-2 py-1 text-right">{(file.progress * 100).toFixed(1)}%</td>
                <td className="px-2 py-1 text-right">
                  <Select
                    className="h-7 text-xs w-24 ml-auto px-1.5 py-0"
                    value={String(file.priority)}
                    onChange={(e) => handlePriorityChange(file.index, parseInt(e.target.value))}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectOption>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

function PeersTab({ hash, contentHeight }: { hash: string; contentHeight: number }) {
  const { data, isLoading } = useTorrentPeers(hash);

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Loading...</div>;

  const peers: Peer[] = data?.peers ?? [];

  return (
    <ScrollArea style={{ height: contentHeight }}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-4 py-1.5 text-left font-medium w-8"></th>
            <th className="px-2 py-1.5 text-left font-medium">IP</th>
            <th className="px-2 py-1.5 text-left font-medium">Client</th>
            <th className="px-2 py-1.5 text-right font-medium w-20">Down</th>
            <th className="px-2 py-1.5 text-right font-medium w-20">Up</th>
            <th className="px-2 py-1.5 text-right font-medium w-16">Progress</th>
          </tr>
        </thead>
        <tbody>
          {peers.map((peer) => (
            <tr key={peer.ip} className="border-b border-border/50">
              <td className="px-4 py-1 text-center" title={peer.country || undefined}>
                {countryFlag(peer.country)}
              </td>
              <td className="px-2 py-1 font-mono">{peer.ip}</td>
              <td className="px-2 py-1 truncate max-w-[150px]">{peer.client}</td>
              <td className="px-2 py-1 text-right">{formatSpeed(peer.down_speed)}</td>
              <td className="px-2 py-1 text-right">{formatSpeed(peer.up_speed)}</td>
              <td className="px-2 py-1 text-right">{(peer.progress * 100).toFixed(0)}%</td>
            </tr>
          ))}
          {peers.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">No peers</td></tr>
          )}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function TrackersTab({ torrent, contentHeight }: { torrent: TorrentStatus; contentHeight: number }) {
  return (
    <ScrollArea style={{ height: contentHeight }} className="px-4 py-2">
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

function OptionsTab({ hash, torrent, contentHeight }: { hash: string; torrent: TorrentStatus; contentHeight: number }) {
  const { setOptionsMutation } = useTorrentActions();
  const [maxDl, setMaxDl] = useState(String(torrent.max_download_speed));
  const [maxUl, setMaxUl] = useState(String(torrent.max_upload_speed));
  const [maxConn, setMaxConn] = useState(String(torrent.max_connections));
  const [maxSlots, setMaxSlots] = useState(String(torrent.max_upload_slots));
  const [autoManaged, setAutoManaged] = useState(torrent.is_auto_managed);

  // Sync when torrent changes
  useEffect(() => {
    setMaxDl(String(torrent.max_download_speed));
    setMaxUl(String(torrent.max_upload_speed));
    setMaxConn(String(torrent.max_connections));
    setMaxSlots(String(torrent.max_upload_slots));
    setAutoManaged(torrent.is_auto_managed);
  }, [torrent.max_download_speed, torrent.max_upload_speed, torrent.max_connections, torrent.max_upload_slots, torrent.is_auto_managed]);

  async function handleSave() {
    const dl = parseFloat(maxDl);
    const ul = parseFloat(maxUl);
    const conn = parseInt(maxConn);
    const slots = parseInt(maxSlots);
    if (isNaN(dl) || isNaN(ul) || isNaN(conn) || isNaN(slots)) {
      toast.error("Please enter valid numbers (-1 for unlimited)");
      return;
    }
    try {
      await setOptionsMutation.mutateAsync({
        hash,
        options: {
          max_download_speed: dl,
          max_upload_speed: ul,
          max_connections: conn,
          max_upload_slots: slots,
          is_auto_managed: autoManaged,
        },
      });
      toast.success("Torrent options saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <ScrollArea style={{ height: contentHeight }} className="px-4 py-2">
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Max Download (KiB/s)</Label>
            <Input className="h-7 text-xs" type="number" step="any" value={maxDl} onChange={(e) => setMaxDl(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max Upload (KiB/s)</Label>
            <Input className="h-7 text-xs" type="number" step="any" value={maxUl} onChange={(e) => setMaxUl(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max Connections</Label>
            <Input className="h-7 text-xs" type="number" value={maxConn} onChange={(e) => setMaxConn(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max Upload Slots</Label>
            <Input className="h-7 text-xs" type="number" value={maxSlots} onChange={(e) => setMaxSlots(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <Checkbox checked={autoManaged} onCheckedChange={(v) => setAutoManaged(v === true)} />
          <span>Auto Managed</span>
        </label>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Queue Position: {torrent.queue}</span>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={setOptionsMutation.isPending}>
            {setOptionsMutation.isPending ? "Saving..." : "Save Options"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
