import { useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface Option<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  className?: string
}) {
  const buttons = useRef(new Map<T, HTMLButtonElement>())
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)
  const [animate, setAnimate] = useState(false)

  // Measure the selected segment so the background thumb can slide to it.
  useLayoutEffect(() => {
    const measure = () => {
      const button = buttons.current.get(value)
      if (button) setThumb({ left: button.offsetLeft, width: button.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const button of buttons.current.values()) observer.observe(button)
    return () => observer.disconnect()
  }, [value, options.length])

  return (
    <div className={cn("relative inline-flex h-7 items-center rounded-md bg-black/6 p-0.5 dark:bg-white/8", className)}>
      {thumb && (
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 bottom-0.5 left-0 rounded-[5px] bg-background shadow-[0_1px_2px_rgb(0_0_0/0.15)] dark:bg-white/16",
            animate && "transition-[translate,width] duration-250 ease-[cubic-bezier(0.2,0,0,1)]",
          )}
          style={{ width: thumb.width, translate: `${thumb.left}px 0` }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          ref={(node) => {
            if (node) buttons.current.set(option.value, node)
            else buttons.current.delete(option.value)
          }}
          type="button"
          title={option.title}
          onClick={() => {
            setAnimate(true)
            onChange(option.value)
          }}
          className={cn(
            "relative flex h-6 items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-[12px] font-medium transition-colors duration-200",
            value === option.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            !thumb && value === option.value && "bg-background shadow-[0_1px_2px_rgb(0_0_0/0.15)] dark:bg-white/16",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
