import { useState, useCallback, type DragEvent } from "react";
import { useAddTorrent, useConfig } from "@/api/hooks";
import { store } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Link, Magnet, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface AddTorrentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTorrentDialog({ open, onOpenChange }: AddTorrentDialogProps) {
  const [tab, setTab] = useState("file");
  const [magnetUri, setMagnetUri] = useState("");
  const [url, setUrl] = useState("");
  const [downloadLocation, setDownloadLocation] = useState(store.getDefaultDownloadLocation());
  const [dragOver, setDragOver] = useState(false);
  const { addMagnetMutation, addUrlMutation, uploadFileMutation, addFileMutation } = useAddTorrent();
  const { configQuery } = useConfig();

  // Default download path from Deluge config
  const defaultPath = (configQuery.data?.download_location as string) || "";
  const effectivePath = downloadLocation || defaultPath;

  function getOptions(): Record<string, unknown> {
    const opts: Record<string, unknown> = {};
    if (effectivePath) {
      opts.download_location = effectivePath;
    }
    return opts;
  }

  function handleSaveDefaultLocation() {
    store.setDefaultDownloadLocation(downloadLocation);
    toast.success("Default download location saved");
  }

  const handleFile = useCallback(async (file: File) => {
    const opts = effectivePath ? { download_location: effectivePath } : {};
    try {
      const paths = await uploadFileMutation.mutateAsync(file);
      if (paths.length > 0) {
        await addFileMutation.mutateAsync({
          filename: paths[0],
          filedump: "",
          options: opts,
        });
        toast.success(`Added: ${file.name}`);
        onOpenChange(false);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(",");
        if (commaIdx === -1) {
          toast.error("Failed to read torrent file");
          return;
        }
        const base64 = result.slice(commaIdx + 1);
        try {
          await addFileMutation.mutateAsync({
            filename: file.name,
            filedump: base64,
            options: opts,
          });
          toast.success(`Added: ${file.name}`);
          onOpenChange(false);
        } catch (innerErr) {
          toast.error(`Failed to add torrent: ${innerErr instanceof Error ? innerErr.message : "Unknown error"}`);
        }
      };
      reader.onerror = () => {
        toast.error(`Failed to read file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  }, [uploadFileMutation, addFileMutation, onOpenChange, effectivePath]);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      const torrentFiles = files.filter((f) => f.name.endsWith(".torrent"));
      const otherFiles = files.filter((f) => !f.name.endsWith(".torrent"));
      if (otherFiles.length > 0 && torrentFiles.length === 0) {
        toast.error("Only .torrent files are accepted");
      }
      for (const file of torrentFiles) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  async function handleMagnet() {
    if (!magnetUri.trim()) return;
    try {
      await addMagnetMutation.mutateAsync({ uri: magnetUri.trim(), options: getOptions() });
      toast.success("Magnet link added");
      setMagnetUri("");
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleUrl() {
    if (!url.trim()) return;
    try {
      await addUrlMutation.mutateAsync({ url: url.trim(), options: getOptions() });
      toast.success("URL torrent added");
      setUrl("");
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Torrent</DialogTitle>
        </DialogHeader>

        {/* Download location picker */}
        <div className="space-y-1.5">
          <Label htmlFor="dl-location" className="text-xs flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Download Location
          </Label>
          <div className="flex gap-1.5">
            <Input
              id="dl-location"
              className="h-8 text-xs"
              placeholder={defaultPath || "/path/on/server"}
              value={downloadLocation}
              onChange={(e) => setDownloadLocation(e.target.value)}
            />
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={handleSaveDefaultLocation}>
              Save
            </Button>
          </div>
          {defaultPath && !downloadLocation && (
            <p className="text-[10px] text-muted-foreground">Default: {defaultPath}</p>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              File
            </TabsTrigger>
            <TabsTrigger value="magnet" className="flex-1">
              <Magnet className="mr-1.5 h-3.5 w-3.5" />
              Magnet
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1">
              <Link className="mr-1.5 h-3.5 w-3.5" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`mt-3 flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                dragOver ? "border-brand bg-brand/10" : "border-border"
              }`}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop .torrent files here
              </p>
              <label className="mt-2 cursor-pointer text-sm text-link hover:underline">
                or click to browse
                <input
                  type="file"
                  accept=".torrent"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    for (const file of files) handleFile(file);
                  }}
                />
              </label>
            </div>
          </TabsContent>

          <TabsContent value="magnet">
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="magnet-uri">Magnet URI</Label>
                <Input
                  id="magnet-uri"
                  placeholder="magnet:?xt=urn:btih:..."
                  value={magnetUri}
                  onChange={(e) => setMagnetUri(e.target.value)}
                />
              </div>
              <Button
                onClick={handleMagnet}
                disabled={!magnetUri.trim() || addMagnetMutation.isPending}
                className="w-full"
              >
                {addMagnetMutation.isPending ? "Adding..." : "Add Magnet"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="torrent-url">Torrent URL</Label>
                <Input
                  id="torrent-url"
                  placeholder="https://example.com/file.torrent"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUrl}
                disabled={!url.trim() || addUrlMutation.isPending}
                className="w-full"
              >
                {addUrlMutation.isPending ? "Adding..." : "Add URL"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
