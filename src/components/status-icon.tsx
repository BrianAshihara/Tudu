import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Status } from "@/lib/types"
import { cn } from "@/lib/utils"

export function StatusIcon({ status, className }: { status: Status; className?: string }) {
  if (status === "done") {
    return (
      <svg viewBox="0 0 16 16" className={cn("size-4 text-status-done", className)}>
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <path
          d="M4.75 8.25l2.1 2.1 4.4-4.6"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (status === "in_progress") {
    return (
      <svg viewBox="0 0 16 16" className={cn("size-4 text-status-progress", className)}>
        <circle cx="8" cy="8" r="7.1" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 text-status-todo", className)}>
      <circle cx="8" cy="8" r="7.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function isRecent(timestamp: string | null) {
  return timestamp !== null && Date.now() - new Date(timestamp).getTime() < 1500
}

/** Status circle that opens a menu to move the task to any status. */
export function StatusButton({
  status,
  completedAt = null,
  onChange,
  className,
}: {
  status: Status
  completedAt?: string | null
  onChange: (status: Status) => void
  className?: string
}) {
  const [changed, setChanged] = useState(false)
  const stop = (event: React.SyntheticEvent) => event.stopPropagation()

  return (
    <div className="contents" onClick={stop} onPointerDown={stop} onKeyDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Status: ${STATUS_LABEL[status]}`}
          title="Change status"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 data-popup-open:scale-110",
            className,
          )}
        >
          <span key={status} className={cn("flex", (changed || (status === "done" && isRecent(completedAt))) && "animate-pop")}>
            <StatusIcon status={status} />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="start">
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(value) => {
              setChanged(true)
              onChange(value as Status)
            }}
          >
            {STATUSES.map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <StatusIcon status={value} className="size-3.5" />
                {STATUS_LABEL[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
