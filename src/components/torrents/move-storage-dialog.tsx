import { useState } from "react";
import { useTorrentActions } from "@/api/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MoveStorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hashes: string[];
}

export function MoveStorageDialog({ open, onOpenChange, hashes }: MoveStorageDialogProps) {
  const [path, setPath] = useState("");
  const { moveMutation } = useTorrentActions();

  async function handleMove() {
    if (!path.trim()) {
      toast.error("Please enter a destination path");
      return;
    }
    try {
      // Move each torrent — core.move_storage takes one hash at a time
      await Promise.all(hashes.map((hash) => moveMutation.mutateAsync({ hash, dest: path.trim() })));
      toast.success(hashes.length === 1 ? "Moving torrent…" : `Moving ${hashes.length} torrents…`);
      onOpenChange(false);
      setPath("");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move storage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {hashes.length === 1
              ? "Enter the destination path for this torrent's data."
              : `Enter the destination path for ${hashes.length} torrents.`}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="move-dest">Destination path</Label>
            <Input
              id="move-dest"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMove()}
              placeholder="/mnt/media/downloads"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleMove} disabled={moveMutation.isPending || !path.trim()}>
              {moveMutation.isPending ? "Moving…" : "Move"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
