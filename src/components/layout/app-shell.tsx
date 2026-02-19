import type { ReactNode, DragEventHandler } from "react";

interface AppShellProps {
  children: ReactNode;
  onDragOver?: DragEventHandler;
  onDragLeave?: DragEventHandler;
  onDrop?: DragEventHandler;
}

export function AppShell({ children, onDragOver, onDragLeave, onDrop }: AppShellProps) {
  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-background text-foreground"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}
