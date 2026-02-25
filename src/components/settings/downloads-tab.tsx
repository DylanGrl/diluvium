import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function DownloadsTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [downloadLocation, setDownloadLocation] = useState("");
  const [moveCompleted, setMoveCompleted] = useState(false);
  const [moveCompletedPath, setMoveCompletedPath] = useState("");
  const [preAllocate, setPreAllocate] = useState(false);
  const [copyTorrentFile, setCopyTorrentFile] = useState(false);
  const [torrentFilesLocation, setTorrentFilesLocation] = useState("");
  const [autoaddLocation, setAutoaddLocation] = useState("");

  useEffect(() => {
    if (!configQuery.data) return;
    const c = configQuery.data;
    setDownloadLocation(String(c.download_location ?? ""));
    setMoveCompleted(Boolean(c.move_completed ?? false));
    setMoveCompletedPath(String(c.move_completed_path ?? ""));
    setPreAllocate(Boolean(c.pre_allocate_storage ?? false));
    setCopyTorrentFile(Boolean(c.copy_torrent_file ?? false));
    setTorrentFilesLocation(String(c.torrentfiles_location ?? ""));
    setAutoaddLocation(String(c.autoadd_location ?? ""));
  }, [configQuery.data]);

  async function handleSave() {
    try {
      await setConfigMutation.mutateAsync({
        download_location: downloadLocation,
        move_completed: moveCompleted,
        move_completed_path: moveCompletedPath,
        pre_allocate_storage: preAllocate,
        copy_torrent_file: copyTorrentFile,
        torrentfiles_location: torrentFilesLocation,
        autoadd_location: autoaddLocation,
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (configQuery.isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (configQuery.isError) return <div className="py-8 text-center text-sm text-destructive">Failed to load config</div>;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="dl-location">Download location</Label>
        <Input id="dl-location" value={downloadLocation} onChange={(e) => setDownloadLocation(e.target.value)} placeholder="/downloads" />
      </div>

      <div className="space-y-3 border rounded-md p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Move completed</p>
            <p className="text-xs text-muted-foreground">Move finished torrents to a different folder</p>
          </div>
          <Switch checked={moveCompleted} onCheckedChange={setMoveCompleted} />
        </div>
        {moveCompleted && (
          <div className="space-y-1.5">
            <Label htmlFor="move-path">Destination folder</Label>
            <Input id="move-path" value={moveCompletedPath} onChange={(e) => setMoveCompletedPath(e.target.value)} placeholder="/completed" />
          </div>
        )}
      </div>

      <div className="space-y-3 border rounded-md p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Copy .torrent files</p>
            <p className="text-xs text-muted-foreground">Keep a copy of the .torrent file after adding</p>
          </div>
          <Switch checked={copyTorrentFile} onCheckedChange={setCopyTorrentFile} />
        </div>
        {copyTorrentFile && (
          <div className="space-y-1.5">
            <Label htmlFor="torrent-files-location">Torrent files folder</Label>
            <Input id="torrent-files-location" value={torrentFilesLocation} onChange={(e) => setTorrentFilesLocation(e.target.value)} placeholder="/torrents" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-sm font-medium">Pre-allocate disk space</p>
          <p className="text-xs text-muted-foreground">Reserve full disk space when torrent is added</p>
        </div>
        <Switch checked={preAllocate} onCheckedChange={setPreAllocate} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="autoadd">Watch folder (auto-add .torrent files)</Label>
        <Input id="autoadd" value={autoaddLocation} onChange={(e) => setAutoaddLocation(e.target.value)} placeholder="/watch" />
      </div>

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
