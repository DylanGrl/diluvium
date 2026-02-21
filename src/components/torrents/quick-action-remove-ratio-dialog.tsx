import { useState, useEffect } from "react";
import type { TorrentStatus } from "@/api/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuickActionRemoveRatioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  torrents: (TorrentStatus & { hash: string })[];
  /** Called with hashes that match the ratio; parent typically opens RemoveDialog with these. */
  onConfirm: (hashes: string[]) => void;
}

export function QuickActionRemoveRatioDialog({
  open,
  onOpenChange,
  torrents,
  onConfirm,
}: QuickActionRemoveRatioDialogProps) {
  const [ratioInput, setRatioInput] = useState("2");

  const ratio = parseFloat(ratioInput);
  const validRatio = !Number.isNaN(ratio) && ratio >= 0;
  const matching = validRatio
    ? torrents.filter((t) => t.ratio >= ratio)
    : [];
  const matchingHashes = matching.map((t) => t.hash);

  useEffect(() => {
    if (!open) setRatioInput("2");
  }, [open]);

  function handleConfirm() {
    if (!validRatio || matchingHashes.length === 0) return;
    onConfirm(matchingHashes);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove torrents with ratio above</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quick-ratio">Minimum ratio</Label>
            <Input
              id="quick-ratio"
              type="number"
              min={0}
              step={0.1}
              value={ratioInput}
              onChange={(e) => setRatioInput(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>
          {validRatio && (
            <p className="text-sm text-muted-foreground">
              {matching.length} torrent{matching.length !== 1 ? "s" : ""} with ratio ≥ {ratio} will be removed.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!validRatio || matchingHashes.length === 0}
            >
              Remove {matchingHashes.length > 0 ? matchingHashes.length : ""} torrents
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
