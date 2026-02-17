import { useState, useCallback, type DragEvent } from "react";
import { useAddTorrent } from "@/api/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Link, Magnet } from "lucide-react";
import { toast } from "sonner";

interface AddTorrentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTorrentDialog({ open, onOpenChange }: AddTorrentDialogProps) {
  const [tab, setTab] = useState("file");
  const [magnetUri, setMagnetUri] = useState("");
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const { addMagnetMutation, addUrlMutation, uploadFileMutation, addFileMutation } = useAddTorrent();

  const handleFile = useCallback(async (file: File) => {
    try {
      const paths = await uploadFileMutation.mutateAsync(file);
      if (paths.length > 0) {
        // The upload endpoint returns server-side paths; use add_torrent_file with the path
        await addFileMutation.mutateAsync({
          filename: paths[0],
          filedump: "",
          options: {},
        });
        toast.success(`Added: ${file.name}`);
        onOpenChange(false);
      }
    } catch (err) {
      // Fallback: read as base64 and use add_torrent_file
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          await addFileMutation.mutateAsync({
            filename: file.name,
            filedump: base64,
            options: {},
          });
          toast.success(`Added: ${file.name}`);
          onOpenChange(false);
        } catch (innerErr) {
          toast.error(`Failed to add torrent: ${innerErr instanceof Error ? innerErr.message : "Unknown error"}`);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [uploadFileMutation, addFileMutation, onOpenChange]);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        if (file.name.endsWith(".torrent")) {
          handleFile(file);
        }
      }
    },
    [handleFile]
  );

  async function handleMagnet() {
    if (!magnetUri.trim()) return;
    try {
      await addMagnetMutation.mutateAsync({ uri: magnetUri.trim() });
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
      await addUrlMutation.mutateAsync({ url: url.trim() });
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
                dragOver ? "border-blue-500 bg-blue-500/10" : "border-border"
              }`}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop .torrent files here
              </p>
              <label className="mt-2 cursor-pointer text-sm text-blue-500 hover:underline">
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
