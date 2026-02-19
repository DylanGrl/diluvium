import { useState, useEffect, useCallback, useMemo, useRef, type DragEvent } from "react";
import { useConnection, useUpdateUI, useTorrentActions, useExternalIP } from "@/api/hooks";
import type { TorrentStatus, FilterState } from "@/api/types";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TorrentTable } from "@/components/torrents/torrent-table";
import { TorrentDetail } from "@/components/torrents/torrent-detail";
import { TorrentActions } from "@/components/torrents/torrent-actions";
import { AddTorrentDialog } from "@/components/torrents/add-torrent";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { RemoveDialog } from "@/components/torrents/remove-dialog";
import { NFODialog } from "@/components/torrents/nfo-dialog";
import { toast } from "sonner";
import { AlertCircle, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [detailHash, setDetailHash] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<FilterState>("All");
  const [trackerFilter, setTrackerFilter] = useState<string>("All");
  const [labelFilter, setLabelFilter] = useState<string>("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showNFODialog, setShowNFODialog] = useState(false);
  const [nfoHash, setNfoHash] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalDragOver, setGlobalDragOver] = useState(false);
  const lastSelectedRef = useRef<string | null>(null);

  const { connectedQuery, connectToFirst } = useConnection();
  const isConnected = connectedQuery.data === true;
  const connectionFailed = connectedQuery.data === false && !connectedQuery.isLoading;

  const { data: externalIP } = useExternalIP(isConnected);

  // Auto-connect to first available host
  useEffect(() => {
    if (connectedQuery.data === false) {
      connectToFirst();
    }
  }, [connectedQuery.data, connectToFirst]);

  const filterDict: Record<string, string> = {};
  if (stateFilter !== "All") filterDict.state = stateFilter;
  if (trackerFilter !== "All") filterDict.tracker_host = trackerFilter;
  if (labelFilter !== "All") filterDict.label = labelFilter;

  const { data: uiData, isLoading: uiLoading } = useUpdateUI(filterDict, isConnected);
  const actions = useTorrentActions();

  const torrents = uiData?.torrents ?? {};
  const filters = uiData?.filters;
  const stats = uiData?.stats;

  const hasActiveFilters = stateFilter !== "All" || trackerFilter !== "All" || labelFilter !== "All" || searchQuery !== "";

  const torrentList = useMemo(() => {
    const list: (TorrentStatus & { hash: string })[] = Object.entries(torrents).map(
      ([hash, t]) => ({ ...t, hash })
    );
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((t) => t.name.toLowerCase().includes(q));
  }, [torrents, searchQuery]);

  const selectedTorrent = detailHash ? torrents[detailHash] : null;

  // Names for remove dialog
  const selectedNames = useMemo(() => {
    return Array.from(selectedHashes)
      .map((h) => torrents[h]?.name)
      .filter(Boolean) as string[];
  }, [selectedHashes, torrents]);

  const handleSelect = useCallback((hash: string, multi: boolean, shift?: boolean) => {
    setSelectedHashes((prev) => {
      if (shift && lastSelectedRef.current) {
        // Shift+click range selection
        const hashes = torrentList.map((t) => t.hash);
        const startIdx = hashes.indexOf(lastSelectedRef.current);
        const endIdx = hashes.indexOf(hash);
        if (startIdx >= 0 && endIdx >= 0) {
          const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
          const next = new Set(prev);
          for (let i = from; i <= to; i++) {
            next.add(hashes[i]);
          }
          return next;
        }
      }
      if (multi) {
        const next = new Set(prev);
        if (next.has(hash)) next.delete(hash);
        else next.add(hash);
        return next;
      }
      return new Set([hash]);
    });
    lastSelectedRef.current = hash;
    setDetailHash(hash);
  }, [torrentList]);

  const handleSelectAll = useCallback(() => {
    setSelectedHashes((prev) => {
      if (prev.size === torrentList.length) {
        return new Set();
      }
      return new Set(torrentList.map((t) => t.hash));
    });
  }, [torrentList]);

  const handleAction = useCallback(
    async (action: string) => {
      const hashes = Array.from(selectedHashes);
      if (hashes.length === 0) return;

      try {
        switch (action) {
          case "pause":
            await actions.pauseMutation.mutateAsync(hashes);
            toast.success("Torrents paused");
            break;
          case "resume":
            await actions.resumeMutation.mutateAsync(hashes);
            toast.success("Torrents resumed");
            break;
          case "remove":
            setShowRemoveDialog(true);
            return;
          case "recheck":
            await actions.recheckMutation.mutateAsync(hashes);
            toast.success("Rechecking torrents");
            break;
          case "queue_top":
            await actions.queueTopMutation.mutateAsync(hashes);
            toast.success("Moved to top of queue");
            break;
          case "queue_up":
            await actions.queueUpMutation.mutateAsync(hashes);
            toast.success("Moved up in queue");
            break;
          case "queue_down":
            await actions.queueDownMutation.mutateAsync(hashes);
            toast.success("Moved down in queue");
            break;
          case "queue_bottom":
            await actions.queueBottomMutation.mutateAsync(hashes);
            toast.success("Moved to bottom of queue");
            break;
          case "copy_name": {
            const name = torrents[hashes[0]]?.name;
            if (name) {
              await navigator.clipboard.writeText(name);
              toast.success("Name copied");
            }
            break;
          }
          case "copy_hash": {
            await navigator.clipboard.writeText(hashes[0]);
            toast.success("Hash copied");
            break;
          }
          case "generate_nfo": {
            setNfoHash(hashes[0]);
            setShowNFODialog(true);
            return;
          }
        }
      } catch (err) {
        toast.error(`Action failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    },
    [selectedHashes, actions, torrents]
  );

  const handleRemoveConfirm = useCallback(
    async (removeData: boolean) => {
      const hashes = Array.from(selectedHashes);
      try {
        await actions.removeMutation.mutateAsync({ hashes, removeData });
        setSelectedHashes(new Set());
        setDetailHash(null);
        toast.success(removeData ? "Torrents and data removed" : "Torrents removed");
      } catch (err) {
        toast.error(`Remove failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
      setShowRemoveDialog(false);
    },
    [selectedHashes, actions]
  );

  const clearFilters = useCallback(() => {
    setStateFilter("All");
    setTrackerFilter("All");
    setLabelFilter("All");
    setSearchQuery("");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSelectAll();
          } else {
            e.preventDefault();
            setShowAddDialog(true);
          }
          break;
        case "Delete":
        case "Backspace":
          if (selectedHashes.size > 0) {
            e.preventDefault();
            setShowRemoveDialog(true);
          }
          break;
        case " ":
          if (selectedHashes.size > 0) {
            e.preventDefault();
            const firstHash = Array.from(selectedHashes)[0];
            const t = torrents[firstHash];
            if (t?.state === "Paused") handleAction("resume");
            else handleAction("pause");
          }
          break;
        case "Escape":
          setDetailHash(null);
          setSelectedHashes(new Set());
          break;
        case "n":
          if (!e.ctrlKey && !e.metaKey && selectedHashes.size > 0) {
            e.preventDefault();
            const firstHash = Array.from(selectedHashes)[0];
            setNfoHash(firstHash);
            setShowNFODialog(true);
          }
          break;
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById("torrent-search")?.focus();
          }
          break;
      }
    }

    // Global paste handler for magnet links
    function handlePaste(e: ClipboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const text = e.clipboardData?.getData("text");
      if (text?.startsWith("magnet:")) {
        e.preventDefault();
        setShowAddDialog(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [selectedHashes, handleAction, handleSelectAll, torrents]);

  // Global drag-and-drop
  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setGlobalDragOver(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    if (e.currentTarget === e.target) {
      setGlobalDragOver(false);
    }
  }, []);

  const handleGlobalDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setGlobalDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const torrentFiles = files.filter((f) => f.name.endsWith(".torrent"));
    if (torrentFiles.length > 0) {
      setShowAddDialog(true);
    } else if (files.length > 0) {
      toast.error("Only .torrent files are accepted");
    }
  }, []);

  return (
    <AppShell
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      <Header
        stats={stats}
        isConnected={isConnected}
        externalIP={externalIP}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddTorrent={() => setShowAddDialog(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenMobileSidebar={() => setShowMobileSidebar(true)}
      />

      {/* Connection warning banner */}
      {connectionFailed && (
        <div className="flex shrink-0 items-center gap-2 border-b bg-state-error/10 px-4 py-2 text-sm text-state-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Not connected to Deluge daemon</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7"
            onClick={() => connectToFirst()}
          >
            <RefreshCw className="mr-1.5 h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          filters={filters}
          stateFilter={stateFilter}
          trackerFilter={trackerFilter}
          labelFilter={labelFilter}
          onStateFilter={setStateFilter}
          onTrackerFilter={setTrackerFilter}
          onLabelFilter={setLabelFilter}
        />
        <MobileSidebar
          open={showMobileSidebar}
          onOpenChange={setShowMobileSidebar}
          filters={filters}
          stateFilter={stateFilter}
          trackerFilter={trackerFilter}
          labelFilter={labelFilter}
          onStateFilter={setStateFilter}
          onTrackerFilter={setTrackerFilter}
          onLabelFilter={setLabelFilter}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TorrentActions
            selectedCount={selectedHashes.size}
            onAction={handleAction}
          />
          <TorrentTable
            torrents={torrentList}
            selectedHashes={selectedHashes}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onAction={handleAction}
            isLoading={uiLoading}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
          {detailHash && selectedTorrent && (
            <TorrentDetail
              hash={detailHash}
              torrent={selectedTorrent}
              onClose={() => setDetailHash(null)}
            />
          )}
        </div>
      </div>

      {/* Global drag overlay */}
      {globalDragOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-brand bg-brand/10 px-12 py-8">
            <Upload className="h-12 w-12 text-brand" />
            <p className="text-lg font-medium text-brand">Drop .torrent files to add</p>
          </div>
        </div>
      )}

      <AddTorrentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <RemoveDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        names={selectedNames}
        onConfirm={handleRemoveConfirm}
      />
      <NFODialog
        open={showNFODialog}
        onOpenChange={setShowNFODialog}
        hash={nfoHash}
        torrent={nfoHash ? torrents[nfoHash] ?? null : null}
      />
    </AppShell>
  );
}
