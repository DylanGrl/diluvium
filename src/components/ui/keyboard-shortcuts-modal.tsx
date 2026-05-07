import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { key: string; description: string }[][] = [
  [
    { key: "A", description: "Add torrent" },
    { key: "Ctrl+A", description: "Select all" },
    { key: "↑ / ↓", description: "Navigate list" },
    { key: "Space", description: "Pause / Resume selection" },
    { key: "Del / ⌫", description: "Remove selection" },
    { key: "Esc", description: "Deselect / Close" },
  ],
  [
    { key: "Ctrl+F", description: "Focus search" },
    { key: "N", description: "Generate NFO" },
    { key: "C", description: "Toggle column picker" },
    { key: "?", description: "Show this help" },
    { key: "Paste magnet:", description: "Add magnet link" },
  ],
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-xl border bg-card shadow-xl mx-4 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6 p-5">
          {SHORTCUTS.map((group, gi) => (
            <div key={gi} className="space-y-2">
              {group.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{description}</span>
                  <kbd className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
