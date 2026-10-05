import { useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { StatusIcon } from "@/components/status-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Status, type Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

export function TaskMenu({ task, className }: { task: Task; className?: string }) {
  const { updateTask, deleteTask } = useTudu()
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      className="contents"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Task options"
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground data-popup-open:bg-accent",
            className,
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end">
          <DropdownMenuRadioGroup
            value={task.status}
            onValueChange={(status) => updateTask(task.id, { status: status as Status })}
          >
            {STATUSES.map((status) => (
              <DropdownMenuRadioItem key={status} value={status}>
                <StatusIcon status={status} className="size-3.5" />
                {STATUS_LABEL[status]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this task?"
        description={`"${task.title}" and all of its notes will be permanently removed.`}
        onConfirm={() => deleteTask(task.id)}
      />
    </div>
  )
}
