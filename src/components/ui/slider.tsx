import * as React from "react"

import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = [0],
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
    const trackRef = React.useRef<HTMLDivElement>(null)

    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : uncontrolledValue

    const percentage = ((value[0] - min) / (max - min)) * 100

    const updateValue = React.useCallback(
      (clientX: number) => {
        if (disabled || !trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
        const rawValue = min + fraction * (max - min)
        const steppedValue = Math.round(rawValue / step) * step
        const clampedValue = Math.min(Math.max(steppedValue, min), max)
        const newValue = [clampedValue]

        if (!isControlled) {
          setUncontrolledValue(newValue)
        }
        onValueChange?.(newValue)
      },
      [disabled, min, max, step, isControlled, onValueChange]
    )

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return
        e.preventDefault()
        updateValue(e.clientX)

        const handlePointerMove = (e: PointerEvent) => {
          updateValue(e.clientX)
        }

        const handlePointerUp = () => {
          document.removeEventListener("pointermove", handlePointerMove)
          document.removeEventListener("pointerup", handlePointerUp)
        }

        document.addEventListener("pointermove", handlePointerMove)
        document.addEventListener("pointerup", handlePointerUp)
      },
      [disabled, updateValue]
    )

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <div
          ref={trackRef}
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20 cursor-pointer"
          onPointerDown={handlePointerDown}
        >
          <div
            className="absolute h-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-grab active:cursor-grabbing"
          style={{ left: `calc(${percentage}% - 8px)` }}
          onPointerDown={handlePointerDown}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value[0]}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return
            let newVal = value[0]
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              newVal = Math.min(value[0] + step, max)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              newVal = Math.max(value[0] - step, min)
            } else if (e.key === "Home") {
              newVal = min
            } else if (e.key === "End") {
              newVal = max
            } else {
              return
            }
            e.preventDefault()
            const updated = [newVal]
            if (!isControlled) setUncontrolledValue(updated)
            onValueChange?.(updated)
          }}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
