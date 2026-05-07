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
  enableLongPress?: boolean;
}

function ContextMenu({ children, content, enableLongPress }: ContextMenuProps) {
  const [state, setState] = React.useState<ContextMenuState>({
    x: 0,
    y: 0,
    open: false,
  });
  const menuRef = React.useRef<HTMLDivElement>(null);
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressActive = React.useRef(false);
  const touchMoved = React.useRef(false);

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

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!enableLongPress) return;
    touchMoved.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      if (touchMoved.current) return;
      longPressActive.current = true;
      setState({ x: touch.clientX, y: touch.clientY, open: true });
    }, 500);
  }, [enableLongPress]);

  const handleTouchMove = React.useCallback(() => {
    touchMoved.current = true;
    clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchEnd = React.useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  // Suppress click that fires after long-press touchend
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (longPressActive.current) {
      e.stopPropagation();
      longPressActive.current = false;
    }
  }, []);

  // Adjust position after render using actual menu dimensions
  React.useLayoutEffect(() => {
    if (!state.open || !menuRef.current) return;
    const el = menuRef.current;
    const { width, height } = el.getBoundingClientRect();
    const x = state.x + width > window.innerWidth ? state.x - width : state.x;
    const y = state.y + height > window.innerHeight ? state.y - height : state.y;
    el.style.left = `${Math.max(0, x)}px`;
    el.style.top = `${Math.max(0, y)}px`;
    el.style.visibility = "visible";
  }, [state]);

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >{children}</div>
      {state.open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[180px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
            style={{ top: state.y, left: state.x, visibility: "hidden" }}
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
