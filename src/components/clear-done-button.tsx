import { useState } from "react"
import { Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import type { Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

/** Deletes the given completed tasks after confirmation; the delete can still be undone from the toast. */
export function ClearDoneButton({ tasks, className }: { tasks: Task[]; className?: string }) {
  const { deleteTasks } = useTudu()
  const [confirming, setConfirming] = useState(false)
  if (tasks.length === 0) return null

  return (
    <>
      <button
        type="button"
        title="Delete all completed tasks"
        onClick={() => setConfirming(true)}
        className={cn(
          "flex h-6 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
          className,
        )}
      >
        <Trash2 className="size-3" />
        Clear
      </button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${tasks.length} completed ${tasks.length === 1 ? "task" : "tasks"}?`}
        description="They will be removed from Tudu. You can still undo this for a few seconds."
        onConfirm={() => deleteTasks(tasks.map((task) => task.id))}
      />
    </>
  )
}
