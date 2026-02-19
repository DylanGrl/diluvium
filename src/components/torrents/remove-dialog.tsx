import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface RemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  names: string[];
  onConfirm: (removeData: boolean) => void;
}

export function RemoveDialog({ open, onOpenChange, names, onConfirm }: RemoveDialogProps) {
  const [removeData, setRemoveData] = useState(false);

  function handleConfirm() {
    onConfirm(removeData);
    setRemoveData(false);
  }

  function handleCancel() {
    onOpenChange(false);
    setRemoveData(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {names.length === 1 ? "Torrent" : `${names.length} Torrents`}</AlertDialogTitle>
          <AlertDialogDescription>
            {names.length === 1 ? (
              <>
                Are you sure you want to remove <span className="font-medium text-foreground">{names[0]}</span>?
              </>
            ) : (
              <>Are you sure you want to remove {names.length} torrents?</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={removeData}
            onChange={(e) => setRemoveData((e.target as HTMLInputElement).checked)}
          />
          <span className="text-sm text-state-error font-medium">
            Also delete downloaded files from disk
          </span>
        </label>

        {removeData && (
          <p className="text-xs text-state-error -mt-2">
            Warning: This will permanently delete the downloaded data. This cannot be undone.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {removeData ? "Remove with Data" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
