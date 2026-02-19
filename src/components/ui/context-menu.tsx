import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ContextMenuState {
  x: number;
  y: number;
  open: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

function ContextMenu({ children, content }: ContextMenuProps) {
  const [state, setState] = React.useState<ContextMenuState>({
    x: 0,
    y: 0,
    open: false,
  });
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setState({ x: e.clientX, y: e.clientY, open: true });
  }, []);

  React.useEffect(() => {
    if (!state.open) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setState((s) => ({ ...s, open: false }));
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setState((s) => ({ ...s, open: false }));
      }
    }

    function handleScroll() {
      setState((s) => ({ ...s, open: false }));
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [state.open]);

  // Adjust position to keep menu on screen
  const adjustedPosition = React.useMemo(() => {
    if (!state.open) return { top: 0, left: 0 };
    const menuWidth = 200;
    const menuHeight = 300;
    const x = state.x + menuWidth > window.innerWidth ? state.x - menuWidth : state.x;
    const y = state.y + menuHeight > window.innerHeight ? state.y - menuHeight : state.y;
    return { top: Math.max(0, y), left: Math.max(0, x) };
  }, [state]);

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      {state.open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[180px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
            style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
          >
            <ContextMenuInternalContext.Provider
              value={{ close: () => setState((s) => ({ ...s, open: false })) }}
            >
              {content}
            </ContextMenuInternalContext.Provider>
          </div>,
          document.body
        )}
    </>
  );
}

const ContextMenuInternalContext = React.createContext({ close: () => {} });

interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

const ContextMenuItem = React.forwardRef<HTMLButtonElement, ContextMenuItemProps>(
  ({ className, destructive, onClick, ...props }, ref) => {
    const { close } = React.useContext(ContextMenuInternalContext);
    return (
      <button
        ref={ref}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          destructive && "text-state-error hover:text-state-error focus:text-state-error",
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          close();
        }}
        {...props}
      />
    );
  }
);
ContextMenuItem.displayName = "ContextMenuItem";

function ContextMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

function ContextMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />
  );
}

export { ContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel };
