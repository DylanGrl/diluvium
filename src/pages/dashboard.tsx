import { useState, useEffect, useCallback } from "react";
import { useConnection, useUpdateUI, useTorrentActions } from "@/api/hooks";
import type { TorrentStatus, FilterState } from "@/api/types";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { TorrentTable } from "@/components/torrents/torrent-table";
import { TorrentDetail } from "@/components/torrents/torrent-detail";
import { TorrentActions } from "@/components/torrents/torrent-actions";
import { AddTorrentDialog } from "@/components/torrents/add-torrent";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { toast } from "sonner";

export function DashboardPage() {
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set());
  const [detailHash, setDetailHash] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<FilterState>("All");
  const [trackerFilter, setTrackerFilter] = useState<string>("All");
  const [labelFilter, setLabelFilter] = useState<string>("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { connectedQuery, connectToFirst } = useConnection();
  const isConnected = connectedQuery.data === true;

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

  const { data: uiData } = useUpdateUI(filterDict, isConnected);
  const actions = useTorrentActions();

  const torrents = uiData?.torrents ?? {};
  const filters = uiData?.filters;
  const stats = uiData?.stats;

  const torrentList: (TorrentStatus & { hash: string })[] = Object.entries(
    torrents
  ).map(([hash, t]) => ({ ...t, hash }));

  const selectedTorrent = detailHash ? torrents[detailHash] : null;

  const handleSelect = useCallback((hash: string, multi: boolean) => {
    setSelectedHashes((prev) => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(hash)) next.delete(hash);
        else next.add(hash);
        return next;
      }
      return new Set([hash]);
    });
    setDetailHash(hash);
  }, []);

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
            await actions.removeMutation.mutateAsync({
              hashes,
              removeData: false,
            });
            setSelectedHashes(new Set());
            setDetailHash(null);
            toast.success("Torrents removed");
            break;
          case "remove_data":
            await actions.removeMutation.mutateAsync({
              hashes,
              removeData: true,
            });
            setSelectedHashes(new Set());
            setDetailHash(null);
            toast.success("Torrents and data removed");
            break;
          case "recheck":
            await actions.recheckMutation.mutateAsync(hashes);
            toast.success("Rechecking torrents");
            break;
          case "queue_top":
            await actions.queueTopMutation.mutateAsync(hashes);
            break;
          case "queue_up":
            await actions.queueUpMutation.mutateAsync(hashes);
            break;
          case "queue_down":
            await actions.queueDownMutation.mutateAsync(hashes);
            break;
          case "queue_bottom":
            await actions.queueBottomMutation.mutateAsync(hashes);
            break;
        }
      } catch (err) {
        toast.error(`Action failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    },
    [selectedHashes, actions]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "a":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowAddDialog(true);
          }
          break;
        case "Delete":
        case "Backspace":
          if (selectedHashes.size > 0) {
            e.preventDefault();
            handleAction("remove");
          }
          break;
        case " ":
          if (selectedHashes.size > 0) {
            e.preventDefault();
            // Toggle pause/resume based on first selected torrent's state
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
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedHashes, handleAction, torrents]);

  return (
    <AppShell>
      <Header
        stats={stats}
        onAddTorrent={() => setShowAddDialog(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
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
        <div className="flex flex-1 flex-col overflow-hidden">
          <TorrentActions
            selectedCount={selectedHashes.size}
            onAction={handleAction}
          />
          <TorrentTable
            torrents={torrentList}
            selectedHashes={selectedHashes}
            onSelect={handleSelect}
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

      <AddTorrentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </AppShell>
  );
}
