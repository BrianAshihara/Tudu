import { useState } from "react"

import { SegmentedControl } from "@/components/segmented-control"
import { StatusIcon } from "@/components/status-icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Status, type Task } from "@/lib/types"
import { useTudu } from "@/store/tudu-store"

function NewTaskForm({
  defaults,
  onCreated,
}: {
  defaults: { status?: Status; tagIds?: number[] }
  onCreated: (task: Task) => void
}) {
  const { createTask } = useTudu()
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<Status>(defaults.status ?? "todo")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const task = await createTask({ title: trimmed, status, tagIds: defaults.tagIds })
    if (task) onCreated(task)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>New task</DialogTitle>
      </DialogHeader>
      <input
        autoFocus
        value={title}
        placeholder="What do you need to do?"
        onChange={(event) => setTitle(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-[14px] outline-none focus:border-primary focus:ring-3 focus:ring-ring/30"
      />
      <SegmentedControl
        value={status}
        onChange={setStatus}
        className="self-start"
        options={STATUSES.map((value) => ({
          value,
          label: (
            <>
              <StatusIcon status={value} className="size-3" />
              {STATUS_LABEL[value]}
            </>
          ),
        }))}
      />
      <DialogFooter>
        <Button type="submit" disabled={!title.trim()}>
          Create task
        </Button>
      </DialogFooter>
    </form>
  )
}

export function NewTaskDialog({
  open,
  onOpenChange,
  defaults,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaults: { status?: Status; tagIds?: number[] }
  onCreated: (task: Task) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <NewTaskForm
            defaults={defaults}
            onCreated={(task) => {
              onOpenChange(false)
              onCreated(task)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
