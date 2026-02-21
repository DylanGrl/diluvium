import { useState, useEffect, useMemo } from "react";
import type { TorrentStatus } from "@/api/types";
import { useTorrentFiles, useTorrentNFOData, useCreateTorrent } from "@/api/hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectOption } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Download, FileText, HardDrive } from "lucide-react";
import { generateNFO, TEMPLATES, type NFOData, type TemplateId } from "@/lib/nfo-templates";
import { sanitizeDownloadFilename } from "@/lib/utils";

interface NFODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hash: string | null;
  torrent: TorrentStatus | null;
}

function flattenFiles(data: unknown): { path: string; size: number }[] {
  if (!data || typeof data !== "object") return [];
  const contents = (data as Record<string, unknown>).contents;
  if (!contents || typeof contents !== "object") return [];

  const results: { path: string; size: number }[] = [];

  function walk(node: unknown, path: string) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "file") {
      results.push({ path, size: (n.size as number) ?? 0 });
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

export function NFODialog({ open, onOpenChange, hash, torrent }: NFODialogProps) {
  const [tab, setTab] = useState("nfo");

  if (!hash || !torrent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{torrent.name}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="nfo" className="flex-1">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Generate NFO
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1">
              <HardDrive className="mr-1.5 h-3.5 w-3.5" />
              Create Torrent
            </TabsTrigger>
          </TabsList>
          <TabsContent value="nfo" className="flex-1 min-h-0">
            <NFOTab hash={hash} torrent={torrent} />
          </TabsContent>
          <TabsContent value="create" className="flex-1 min-h-0">
            <CreateTorrentTab torrent={torrent} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function NFOTab({ hash, torrent }: { hash: string; torrent: TorrentStatus }) {
  const [template, setTemplate] = useState<TemplateId>("detailed");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState("");
  const [edited, setEdited] = useState(false);

  const { data: filesData } = useTorrentFiles(hash);
  const { data: nfoData } = useTorrentNFOData(hash);

  const files = useMemo(() => flattenFiles(filesData), [filesData]);

  const nfoInput: NFOData = useMemo(
    () => ({
      name: torrent.name,
      hash: torrent.hash ?? hash,
      totalSize: torrent.total_size,
      files,
      tracker: torrent.tracker_host,
      dateAdded: torrent.time_added,
      pieceSize: nfoData?.piece_length ?? 0,
      numPieces: nfoData?.num_pieces ?? 0,
      creator: nfoData?.creator ?? "",
      comment: torrent.comment,
      notes,
    }),
    [torrent, hash, files, nfoData, notes]
  );

  // Regenerate preview when inputs change, unless user has manually edited
  useEffect(() => {
    if (!edited) {
      setPreview(generateNFO(nfoInput, template));
    }
  }, [nfoInput, template, edited]);

  function handleTemplateChange(value: string) {
    setTemplate(value as TemplateId);
    setEdited(false); // Reset manual edits when switching templates
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    setEdited(false); // Regenerate on notes change
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(preview);
    toast.success("NFO copied to clipboard");
  }

  function handleDownload() {
    const safeName = sanitizeDownloadFilename(torrent.name);
    const blob = new Blob([preview], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.nfo`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("NFO file downloaded");
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-end gap-3">
        <div className="space-y-1.5 flex-1">
          <Label>Template</Label>
          <Select value={template} onChange={(e) => handleTemplateChange(e.target.value)}>
            {TEMPLATES.map((t) => (
              <SelectOption key={t.id} value={t.id}>
                {t.label}
              </SelectOption>
            ))}
          </Select>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Input
          placeholder="Add custom notes to include in the NFO..."
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Preview</Label>
          {edited && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEdited(false);
                setPreview(generateNFO(nfoInput, template));
              }}
            >
              Reset to template
            </button>
          )}
        </div>
        <Textarea
          className="font-mono text-xs leading-relaxed min-h-[280px] resize-y"
          value={preview}
          onChange={(e) => {
            setPreview(e.target.value);
            setEdited(true);
          }}
        />
      </div>
    </div>
  );
}

const PIECE_SIZES = [
  { value: "0", label: "Auto" },
  { value: "262144", label: "256 KiB" },
  { value: "524288", label: "512 KiB" },
  { value: "1048576", label: "1 MiB" },
  { value: "2097152", label: "2 MiB" },
  { value: "4194304", label: "4 MiB" },
  { value: "8388608", label: "8 MiB" },
  { value: "16777216", label: "16 MiB" },
];

function CreateTorrentTab({ torrent }: { torrent: TorrentStatus }) {
  const createMutation = useCreateTorrent();
  const [sourcePath, setSourcePath] = useState(
    `${torrent.save_path}/${torrent.name}`
  );
  const [trackerUrl, setTrackerUrl] = useState("");
  const [additionalTrackers, setAdditionalTrackers] = useState("");
  const [pieceSize, setPieceSize] = useState("0");
  const [isPrivate, setIsPrivate] = useState(false);
  const [sourceTag, setSourceTag] = useState("");
  const [comment, setComment] = useState("");
  const [addToSession, setAddToSession] = useState(true);
  const [resultPath, setResultPath] = useState<string | null>(null);

  // Pre-fill tracker if available
  useEffect(() => {
    if (torrent.tracker_host && !trackerUrl) {
      setTrackerUrl(torrent.tracker_host);
    }
  }, [torrent.tracker_host]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!sourcePath.trim()) {
      toast.error("Source path is required");
      return;
    }
    if (!trackerUrl.trim()) {
      toast.error("Tracker URL is required");
      return;
    }

    // Build tiered tracker list
    const trackers: string[][] = [[trackerUrl.trim()]];
    if (additionalTrackers.trim()) {
      const extra = additionalTrackers
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      for (const t of extra) {
        trackers.push([t]);
      }
    }

    // Build target path for the .torrent file
    const target = `${torrent.save_path}/${torrent.name}.torrent`;

    const fullComment = sourceTag
      ? `${comment}${comment ? " | " : ""}source: ${sourceTag}`
      : comment;

    try {
      const result = await createMutation.mutateAsync({
        path: sourcePath.trim(),
        tracker: trackerUrl.trim(),
        pieceLength: parseInt(pieceSize),
        comment: fullComment,
        target,
        webseeds: [],
        priv: isPrivate,
        createdBy: "Diluvium",
        trackers,
        addToSession,
      });
      setResultPath(result ?? target);
      toast.success("Torrent created successfully");
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="source-path">Source Path (on server)</Label>
        <Input
          id="source-path"
          value={sourcePath}
          onChange={(e) => setSourcePath(e.target.value)}
          placeholder="/path/to/content"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tracker-url">Tracker Announce URL</Label>
        <Input
          id="tracker-url"
          value={trackerUrl}
          onChange={(e) => setTrackerUrl(e.target.value)}
          placeholder="https://tracker.example.com/announce"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="extra-trackers">Additional Trackers (one per line)</Label>
        <Textarea
          id="extra-trackers"
          className="min-h-[60px] text-sm"
          value={additionalTrackers}
          onChange={(e) => setAdditionalTrackers(e.target.value)}
          placeholder="https://tracker2.example.com/announce"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Piece Size</Label>
          <Select value={pieceSize} onChange={(e) => setPieceSize(e.target.value)}>
            {PIECE_SIZES.map((ps) => (
              <SelectOption key={ps.value} value={ps.value}>
                {ps.label}
              </SelectOption>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="source-tag">Source Tag</Label>
          <Input
            id="source-tag"
            value={sourceTag}
            onChange={(e) => setSourceTag(e.target.value)}
            placeholder="e.g. BTN, PTP"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="torrent-comment">Comment</Label>
        <Input
          id="torrent-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isPrivate} onCheckedChange={(v) => setIsPrivate(v === true)} />
          Private torrent
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={addToSession} onCheckedChange={(v) => setAddToSession(v === true)} />
          Add to session
        </label>
      </div>

      <Button
        onClick={handleCreate}
        disabled={createMutation.isPending || !sourcePath.trim() || !trackerUrl.trim()}
        className="w-full"
      >
        {createMutation.isPending ? "Creating..." : "Create Torrent"}
      </Button>

      {resultPath && (
        <div className="rounded-md border bg-muted/50 p-3 text-xs">
          <p className="font-medium text-ul">Torrent created!</p>
          <p className="mt-1 break-all text-muted-foreground">
            Saved to: {resultPath}
          </p>
        </div>
      )}
    </div>
  );
}
