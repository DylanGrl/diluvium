import { useState } from "react";
import { useLabels } from "@/api/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tag, X } from "lucide-react";

interface SetLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hashes: string[];
}

export function SetLabelDialog({ open, onOpenChange, hashes }: SetLabelDialogProps) {
  const [newLabel, setNewLabel] = useState("");
  const { labelsQuery, setTorrentLabelMutation } = useLabels(open);

  const existingLabels = labelsQuery.data ?? [];
  const pluginMissing = labelsQuery.isError;

  async function applyLabel(label: string) {
    if (hashes.length === 0) return;
    try {
      await Promise.all(hashes.map((hash) => setTorrentLabelMutation.mutateAsync({ hash, label })));
      toast.success(
        label === ""
          ? `Cleared label for ${hashes.length} torrent${hashes.length !== 1 ? "s" : ""}`
          : `Set label "${label}" on ${hashes.length} torrent${hashes.length !== 1 ? "s" : ""}`
      );
      onOpenChange(false);
      setNewLabel("");
    } catch {
      toast.error("Failed to set label — is the Label plugin enabled?");
    }
  }

  function handleApplyNew() {
    const label = newLabel.trim();
    if (!label) return;
    applyLabel(label);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Label</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <p className="text-sm text-muted-foreground">
            {hashes.length === 1
              ? "Choose or type a label for this torrent."
              : `Choose or type a label for ${hashes.length} torrents.`}
          </p>

          {pluginMissing && (
            <p className="text-sm text-state-error">
              Label plugin not available on this Deluge instance.
            </p>
          )}

          {existingLabels.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Existing labels</Label>
              <div className="flex flex-wrap gap-1.5">
                {existingLabels.map((l) => (
                  <button
                    key={l}
                    onClick={() => applyLabel(l)}
                    disabled={setTorrentLabelMutation.isPending}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      "hover:border-ring hover:bg-accent hover:text-accent-foreground",
                      "disabled:opacity-50"
                    )}
                  >
                    <Tag className="h-3 w-3" />
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="new-label" className="text-xs">New label</Label>
            <div className="flex gap-2">
              <Input
                id="new-label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyNew()}
                placeholder="e.g. movies"
                className="h-8 text-sm"
                autoFocus={existingLabels.length === 0}
              />
              <Button
                size="sm"
                onClick={handleApplyNew}
                disabled={!newLabel.trim() || setTorrentLabelMutation.isPending}
              >
                Apply
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <button
              onClick={() => applyLabel("")}
              disabled={setTorrentLabelMutation.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Clear label
            </button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
