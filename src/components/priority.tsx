import { ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PRIORITY_LABEL } from "@/lib/meta"
import { PRIORITIES, type Priority } from "@/lib/types"
import { cn } from "@/lib/utils"

const BAR_COLOR: Record<Exclude<Priority, "emergency">, string> = {
  low: "text-[#8e8e93]",
  normal: "text-[#8e8e93] dark:text-[#aeaeb2]",
  high: "text-[#ff9500]",
}

const FILLED_BARS: Record<Exclude<Priority, "emergency">, number> = { low: 1, normal: 2, high: 3 }

const CHIP_STYLE: Record<Exclude<Priority, "normal">, string> = {
  low: "border-border text-muted-foreground",
  high: "border-[#ff9500]/25 bg-[#ff9500]/10 text-[#c93400] dark:text-[#ffb340]",
  emergency: "border-[#ff3b30]/25 bg-[#ff3b30]/10 text-[#d70015] dark:text-[#ff6961]",
}

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  if (priority === "emergency") {
    return (
      <svg viewBox="0 0 16 16" className={cn("size-4 text-[#ff3b30] dark:text-[#ff453a]", className)}>
        <rect x="1" y="1" width="14" height="14" rx="4" fill="currentColor" />
        <path d="M8 4.25v4.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="8" cy="11.4" r="1.1" fill="white" />
      </svg>
    )
  }
  const filled = FILLED_BARS[priority]
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4", BAR_COLOR[priority], className)}>
      {[0, 1, 2].map((index) => (
        <rect
          key={index}
          x={2 + index * 4.5}
          y={10 - index * 3.5}
          width="3"
          height={4 + index * 3.5}
          rx="1"
          fill="currentColor"
          opacity={index < filled ? 1 : 0.25}
        />
      ))}
    </svg>
  )
}

/** Compact chip shown on rows and cards; normal priority stays hidden to keep things quiet. */
export function PriorityChip({ priority, compact, className }: { priority: Priority; compact?: boolean; className?: string }) {
  if (priority === "normal") return null
  const icon = (
    <PriorityIcon priority={priority} className={cn("size-3.5", priority === "emergency" && "animate-soft-pulse")} />
  )
  if (compact) {
    return (
      <span title={`${PRIORITY_LABEL[priority]} priority`} className={cn("inline-flex shrink-0", className)}>
        {icon}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium",
        CHIP_STYLE[priority],
        className,
      )}
    >
      {icon}
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function PriorityItems() {
  return PRIORITIES.map((priority) => (
    <DropdownMenuRadioItem key={priority} value={priority}>
      <PriorityIcon priority={priority} className="size-3.5" />
      {PRIORITY_LABEL[priority]}
    </DropdownMenuRadioItem>
  ))
}

export function PriorityPicker({
  value,
  onChange,
  className,
  labelClassName,
}: {
  value: Priority
  onChange: (priority: Priority) => void
  className?: string
  labelClassName?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className} title="Priority">
        <PriorityIcon priority={value} className="size-3.5" />
        <span className={labelClassName}>{PRIORITY_LABEL[value]}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={(priority) => onChange(priority as Priority)}>
          <PriorityItems />
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
