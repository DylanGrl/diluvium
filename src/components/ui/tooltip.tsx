import * as React from "react"

import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

const TooltipDelayContext = React.createContext<number>(200)

function TooltipProvider({ children, delayDuration = 200 }: TooltipProviderProps) {
  return (
    <TooltipDelayContext.Provider value={delayDuration}>
      {children}
    </TooltipDelayContext.Provider>
  )
}

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  delayDuration: number
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  delayDuration: 200,
})

interface TooltipProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
}

function Tooltip({ children, open: controlledOpen, onOpenChange, delayDuration: propDelay }: TooltipProps) {
  const contextDelay = React.useContext(TooltipDelayContext)
  const delayDuration = propDelay ?? contextDelay
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value)
      }
      onOpenChange?.(value)
    },
    [isControlled, onOpenChange]
  )

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, delayDuration }}>
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  const { setOpen, triggerRef, delayDuration } = React.useContext(TooltipContext)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    },
    [ref, triggerRef]
  )

  return (
    <button
      ref={combinedRef}
      type="button"
      onMouseEnter={() => {
        timeoutRef.current = setTimeout(() => setOpen(true), delayDuration)
      }}
      onMouseLeave={() => {
        clearTimeout(timeoutRef.current)
        setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", sideOffset = 4, children, ...props }, ref) => {
    const { open, triggerRef } = React.useContext(TooltipContext)
    const [position, setPosition] = React.useState({ top: 0, left: 0 })

    React.useEffect(() => {
      if (open && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()

        let top: number
        let left: number

        switch (side) {
          case "top":
            top = rect.top - sideOffset
            left = rect.left + rect.width / 2
            break
          case "bottom":
            top = rect.bottom + sideOffset
            left = rect.left + rect.width / 2
            break
          case "left":
            top = rect.top + rect.height / 2
            left = rect.left - sideOffset
            break
          case "right":
            top = rect.top + rect.height / 2
            left = rect.right + sideOffset
            break
        }

        setPosition({ top, left })
      }
    }, [open, side, sideOffset, triggerRef])

    if (!open) return null

    const transformMap = {
      top: "-translate-x-1/2 -translate-y-full",
      bottom: "-translate-x-1/2",
      left: "-translate-x-full -translate-y-1/2",
      right: "-translate-y-1/2",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95",
          transformMap[side],
          className
        )}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
