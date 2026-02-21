import { Button } from "@/components/ui/button";
import {
  Pause,
  Play,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  FileText,
} from "lucide-react";

interface TorrentActionsProps {
  selectedCount: number;
  onAction: (action: string) => void;
}

export function TorrentActions({ selectedCount, onAction }: TorrentActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-muted/30 px-3 py-2 sm:py-1.5">
      <span className="mr-2 text-xs text-muted-foreground">
        {selectedCount} selected
      </span>
      <Button variant="ghost" size="sm" onClick={() => onAction("resume")} title="Resume">
        <Play className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="sm:hidden ml-1 text-xs">Resume</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("pause")} title="Pause">
        <Pause className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="sm:hidden ml-1 text-xs">Pause</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("remove")} title="Remove">
        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="sm:hidden ml-1 text-xs">Remove</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("recheck")} title="Recheck">
        <RefreshCw className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </Button>
      <div className="mx-1 h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" onClick={() => onAction("queue_top")} title="Queue Top">
        <ChevronsUp className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("queue_up")} title="Queue Up">
        <ChevronUp className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("queue_down")} title="Queue Down">
        <ChevronDown className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("queue_bottom")} title="Queue Bottom">
        <ChevronsDown className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
      </Button>
      {selectedCount === 1 && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={() => onAction("generate_nfo")} title="Generate NFO / Create Torrent">
            <FileText className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
