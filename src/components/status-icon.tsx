import { STATUS_LABEL, nextStatus } from "@/lib/meta"
import type { Status } from "@/lib/types"
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

export function StatusButton({
  status,
  onChange,
  className,
}: {
  status: Status
  onChange: (status: Status) => void
  className?: string
}) {
  const next = nextStatus(status)
  return (
    <button
      type="button"
      aria-label={`Mark as ${STATUS_LABEL[next]}`}
      title={`Mark as ${STATUS_LABEL[next]}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation()
        onChange(next)
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95",
        className,
      )}
    >
      <StatusIcon status={status} />
    </button>
  )
}
