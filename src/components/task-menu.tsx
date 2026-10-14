import { MoreHorizontal } from "lucide-react"

import { PriorityIcon, PriorityItems } from "@/components/priority"
import { StatusIcon } from "@/components/status-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Priority, type Status, type Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

export function TaskMenu({ task, className }: { task: Task; className?: string }) {
  const { updateTask, deleteTask } = useTudu()

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
        <DropdownMenuContent className="w-48" align="end">
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <PriorityIcon priority={task.priority} className="size-3.5" />
              Priority: {PRIORITY_LABEL[task.priority]}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              <DropdownMenuRadioGroup
                value={task.priority}
                onValueChange={(priority) => updateTask(task.id, { priority: priority as Priority })}
              >
                <PriorityItems />
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => deleteTask(task.id)}>
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
