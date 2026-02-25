import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TorrentStatus, Peer } from "@/api/types";
import { useTorrentFiles, useTorrentPeers, useTorrentActions, useTorrentTrackers, useTorrentPieces } from "@/api/hooks";
import { delugeClient } from "@/api/client";
import { formatBytes, formatSpeed, formatDate, formatETA, formatRatio, cn, progressColor } from "@/lib/utils";
import { store } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectOption } from "@/components/ui/select";
import { X, GripHorizontal, Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CROSS_SEED_DOCS_URL = "https://github.com/cross-seed/cross-seed";

const LazySpeedGraphTab = lazy(() =>
  import("./speed-graph-tab").then((m) => ({ default: m.SpeedGraphTab }))
);

interface TorrentDetailProps {
  hash: string;
  torrent: TorrentStatus;
  onClose: () => void;
  isMobile?: boolean;
}

// Country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const c = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(c).map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
  );
}

export function TorrentDetail({ hash, torrent, onClose, isMobile }: TorrentDetailProps) {
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
      const maxHeight = isMobile
        ? Math.max(200, Math.min(window.innerHeight * 0.85, startHeightRef.current + delta))
        : Math.min(600, window.innerHeight - 100);
      const next = Math.max(isMobile ? 200 : 150, Math.min(maxHeight, startHeightRef.current + delta));
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
  }, [panelHeight, isMobile]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    draggingRef.current = true;
    startYRef.current = touch.clientY;
    startHeightRef.current = panelHeight;

    function onTouchMove(ev: TouchEvent) {
      if (!draggingRef.current) return;
      ev.preventDefault();
      const t = ev.touches[0];
      const delta = startYRef.current - t.clientY;
      const maxHeight = isMobile
        ? window.innerHeight * 0.85
        : Math.min(600, window.innerHeight - 100);
      const next = Math.max(isMobile ? 200 : 150, Math.min(maxHeight, startHeightRef.current + delta));
      setPanelHeight(next);
    }

    function onTouchEnd() {
      if (draggingRef.current) {
        draggingRef.current = false;
        setPanelHeight((h) => {
          store.setDetailPanelHeight(h);
          return h;
        });
      }
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    }

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }, [panelHeight, isMobile]);

  const contentHeight = panelHeight - 88; // drag handle + title bar + tabs

  const panelContent = (
    <>
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="flex h-5 shrink-0 cursor-row-resize touch-none items-center justify-center hover:bg-muted/50"
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
        <div className="overflow-x-auto px-4 mt-1 shrink-0">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="speed">Speed</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="peers">Peers</TabsTrigger>
            <TabsTrigger value="trackers">Trackers</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-hidden" style={{ height: contentHeight }}>
          <TabsContent value="general">
            <GeneralTab hash={hash} torrent={torrent} contentHeight={contentHeight} />
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
            <TrackersTab hash={hash} contentHeight={contentHeight} />
          </TabsContent>
          <TabsContent value="options">
            <OptionsTab hash={hash} torrent={torrent} contentHeight={contentHeight} />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-40">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        {/* Bottom sheet */}
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl bg-card animate-in slide-in-from-bottom"
          style={{ height: panelHeight, maxHeight: "85vh" }}
        >
          {panelContent}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="shrink-0 border-t bg-card flex flex-col" style={{ height: panelHeight }}>
      {panelContent}
    </div>
  );
}

const PIECE_BUCKETS = 200;

function PieceMap({ hash }: { hash: string }) {
  const { data } = useTorrentPieces(hash);
  const pieces = data?.pieces;

  if (!pieces || pieces.length === 0) return null;

  // Bucket pieces into PIECE_BUCKETS visual columns
  const bucketSize = Math.max(1, Math.ceil(pieces.length / PIECE_BUCKETS));
  const buckets: number[] = [];
  for (let i = 0; i < PIECE_BUCKETS; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, pieces.length);
    if (start >= pieces.length) break;
    let sum = 0;
    for (let j = start; j < end; j++) sum += pieces[j];
    buckets.push(sum / (end - start));
  }

  return (
    <div className="mb-3">
      <p className="text-xs text-muted-foreground mb-1">
        Pieces ({pieces.length})
      </p>
      <div className="flex gap-px h-3 rounded overflow-hidden bg-muted">
        {buckets.map((avg, i) => {
          let cls = "bg-muted";
          if (avg >= 3) cls = "bg-ul";
          else if (avg >= 2) cls = "bg-dl";
          else if (avg > 0) cls = "bg-state-warning";
          return (
            <div
              key={i}
              className={cn("flex-1 min-w-0", cls)}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-ul" /> Complete
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-dl" /> Downloading
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-muted border border-border" /> Missing
        </span>
      </div>
    </div>
  );
}

function GeneralTab({
  hash,
  torrent,
  contentHeight,
}: {
  hash: string;
  torrent: TorrentStatus;
  contentHeight: number;
}) {
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

  async function copyInfohash() {
    await navigator.clipboard.writeText(hash);
    toast.success("Infohash copied");
  }

  return (
    <ScrollArea style={{ height: contentHeight }} className="px-4 py-2">
      <div className="mb-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", progressColor(torrent.progress, torrent.state))}
            style={{ width: `${Math.min(torrent.progress, 100)}%` }}
          />
        </div>
      </div>
      {torrent.progress < 100 && <PieceMap hash={hash} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="truncate text-right">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Cross-seed</p>
        <p className="text-xs text-muted-foreground">
          Use this infohash with cross-seed to find matching torrents on other trackers.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[12rem]" title={hash}>
            {hash}
          </code>
          <Button variant="outline" size="sm" className="h-7 gap-1" onClick={copyInfohash}>
            <Copy className="h-3 w-3" />
            Copy infohash
          </Button>
          <a
            href={CROSS_SEED_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            cross-seed docs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
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
        <div className="overflow-x-auto">
        <table className="min-w-[420px] w-full text-xs">
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
        </div>
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
      <div className="overflow-x-auto">
      <table className="min-w-[360px] w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="px-4 py-1.5 text-left font-medium w-8"></th>
            <th className="px-2 py-1.5 text-left font-medium">IP</th>
            <th className="hidden sm:table-cell px-2 py-1.5 text-left font-medium">Client</th>
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
              <td className="hidden sm:table-cell px-2 py-1 truncate max-w-[150px]">{peer.client}</td>
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
      </div>
    </ScrollArea>
  );
}

function TrackersTab({ hash, contentHeight }: { hash: string; contentHeight: number }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useTorrentTrackers(hash);
  const [newUrl, setNewUrl] = useState("");
  const [newTier, setNewTier] = useState("0");

  const trackers = data?.trackers ?? [];

  const setTrackersMutation = useMutation({
    mutationFn: (list: { url: string; tier: number }[]) =>
      delugeClient.setTorrentTrackers(hash, list),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["torrent", "trackers", hash] }),
  });

  const reannounce = useMutation({
    mutationFn: () => delugeClient.forceReannounce([hash]),
    onSuccess: () => {
      toast.success("Reannouncing…");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["torrent", "trackers", hash] }), 2000);
    },
  });

  async function handleRemove(url: string) {
    const updated = trackers.filter((t) => t.url !== url).map(({ url: u, tier }) => ({ url: u, tier }));
    try {
      await setTrackersMutation.mutateAsync(updated);
      toast.success("Tracker removed");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleAdd() {
    if (!newUrl.trim()) return;
    const tier = parseInt(newTier) || 0;
    const updated = [
      ...trackers.map(({ url, tier: t }) => ({ url, tier: t })),
      { url: newUrl.trim(), tier },
    ];
    try {
      await setTrackersMutation.mutateAsync(updated);
      setNewUrl("");
      setNewTier("0");
      toast.success("Tracker added");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (isLoading) return <div className="p-4 text-xs text-muted-foreground">Loading…</div>;

  return (
    <div style={{ height: contentHeight }} className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-1.5 border-b shrink-0">
        <span className="text-xs text-muted-foreground">{trackers.length} tracker{trackers.length !== 1 ? "s" : ""}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs"
          onClick={() => reannounce.mutate()}
          disabled={reannounce.isPending}
        >
          Reannounce all
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <table className="min-w-[500px] w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-1.5 text-left font-medium">URL</th>
              <th className="px-2 py-1.5 text-center font-medium w-12">Tier</th>
              <th className="px-2 py-1.5 text-right font-medium w-16">Seeds</th>
              <th className="px-2 py-1.5 text-right font-medium w-16">Peers</th>
              <th className="px-2 py-1.5 text-left font-medium">Status</th>
              <th className="px-2 py-1.5 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {trackers.map((tracker) => (
              <tr key={tracker.url} className="border-b border-border/50">
                <td className="px-4 py-1 truncate max-w-[220px] font-mono text-[10px]">{tracker.url}</td>
                <td className="px-2 py-1 text-center text-muted-foreground">{tracker.tier}</td>
                <td className="px-2 py-1 text-right">{tracker.seeds >= 0 ? tracker.seeds : "—"}</td>
                <td className="px-2 py-1 text-right">{tracker.peers >= 0 ? tracker.peers : "—"}</td>
                <td className="px-2 py-1 text-muted-foreground truncate max-w-[140px]">
                  {tracker.updating ? (
                    <span className="text-brand">Updating…</span>
                  ) : tracker.message ? (
                    tracker.message
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1 text-right">
                  <button
                    onClick={() => handleRemove(tracker.url)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove tracker"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {trackers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">No trackers</td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
      {/* Add tracker */}
      <div className="flex gap-2 px-4 py-2 border-t shrink-0">
        <Input
          className="h-7 text-xs flex-1"
          placeholder="https://tracker.example.com/announce"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Input
          className="h-7 text-xs w-16"
          type="number"
          placeholder="Tier"
          value={newTier}
          onChange={(e) => setNewTier(e.target.value)}
          title="Tier"
        />
        <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!newUrl.trim() || setTrackersMutation.isPending}>
          Add
        </Button>
      </div>
    </div>
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
