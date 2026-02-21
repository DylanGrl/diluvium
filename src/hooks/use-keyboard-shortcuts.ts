import { useEffect } from "react";

interface KeyboardShortcutActions {
  onAddTorrent: () => void;
  onRemove: () => void;
  onTogglePause: () => void;
  onDeselect: () => void;
  onNFO: () => void;
  onSearch: () => void;
  onSelectAll: () => void;
  onMagnetPaste: () => void;
  hasSelection: boolean;
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions) {
  const {
    onAddTorrent,
    onRemove,
    onTogglePause,
    onDeselect,
    onNFO,
    onSearch,
    onSelectAll,
    onMagnetPaste,
    hasSelection,
  } = actions;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSelectAll();
          } else {
            e.preventDefault();
            onAddTorrent();
          }
          break;
        case "Delete":
        case "Backspace":
          if (hasSelection) {
            e.preventDefault();
            onRemove();
          }
          break;
        case " ":
          if (hasSelection) {
            e.preventDefault();
            onTogglePause();
          }
          break;
        case "Escape":
          onDeselect();
          break;
        case "n":
          if (!e.ctrlKey && !e.metaKey && hasSelection) {
            e.preventDefault();
            onNFO();
          }
          break;
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSearch();
          }
          break;
      }
    }

    function handlePaste(e: ClipboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const text = e.clipboardData?.getData("text");
      if (text?.startsWith("magnet:")) {
        e.preventDefault();
        onMagnetPaste();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [
    onAddTorrent,
    onRemove,
    onTogglePause,
    onDeselect,
    onNFO,
    onSearch,
    onSelectAll,
    onMagnetPaste,
    hasSelection,
  ]);
}
