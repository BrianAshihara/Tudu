import { useState } from "react"
import { Maximize2, Minimize2, PanelRightClose, Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { MarkdownEditor } from "@/components/markdown-editor"
import { SegmentedControl } from "@/components/segmented-control"
import { StatusIcon } from "@/components/status-icon"
import { TagPicker } from "@/components/tag-picker"
import { formatLong } from "@/lib/format"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

function TitleField({ task }: { task: Task }) {
  const { updateTask } = useTudu()
  const [title, setTitle] = useState(task.title)

  const commit = () => {
    const trimmed = title.trim()
    if (!trimmed) setTitle(task.title)
    else if (trimmed !== task.title) updateTask(task.id, { title: trimmed })
  }

  return (
    <textarea
      rows={1}
      value={title}
      onChange={(event) => setTitle(event.target.value.replace(/\n/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === "Escape") {
          setTitle(task.title)
          event.currentTarget.blur()
        }
      }}
      className={cn(
        "w-full resize-none bg-transparent text-[20px] leading-7 font-semibold outline-none field-sizing-content",
        task.status === "done" && "text-muted-foreground",
      )}
    />
  )
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="flex h-7 items-center text-[12px] text-muted-foreground">{label}</span>
      <div className="flex min-h-7 items-center">{children}</div>
    </>
  )
}

export function TaskDetail({
  task,
  expanded,
  onToggleExpanded,
  onClose,
}: {
  task: Task
  expanded: boolean
  onToggleExpanded: () => void
  onClose: () => void
}) {
  const { updateTask, deleteTask } = useTudu()
  const [confirming, setConfirming] = useState(false)

  return (
    <aside
      className={cn(
        "flex min-w-0 flex-col bg-background",
        expanded ? "flex-1" : "w-[440px] shrink-0 border-l border-border",
      )}
    >
      <header data-tauri-drag-region className="flex h-13 shrink-0 items-center gap-1 pr-38 pl-3">
        <button
          type="button"
          onClick={onToggleExpanded}
          title={expanded ? "Show in side panel" : "Open full page"}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>
        <div data-tauri-drag-region className="h-full flex-1" />
        <button
          type="button"
          onClick={() => setConfirming(true)}
          title="Delete task"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close panel"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <PanelRightClose className="size-4" />
        </button>
        <span className="ml-2 h-5 w-px bg-border" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn("flex flex-col gap-5 px-6 pt-1 pb-10", expanded && "mx-auto w-full max-w-3xl")}>
          <TitleField key={`${task.id}-${task.title}`} task={task} />

          <div className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5">
            <Property label="Status">
              <SegmentedControl
                value={task.status}
                onChange={(status) => updateTask(task.id, { status })}
                options={STATUSES.map((status) => ({
                  value: status,
                  label: (
                    <>
                      <StatusIcon status={status} className="size-3" />
                      {STATUS_LABEL[status]}
                    </>
                  ),
                }))}
              />
            </Property>
            <Property label="Tags">
              <TagPicker task={task} />
            </Property>
            <Property label="Created">
              <span className="text-[12px]">{formatLong(task.createdAt)}</span>
            </Property>
            <Property label="Updated">
              <span className="text-[12px]">{formatLong(task.updatedAt)}</span>
            </Property>
            {task.completedAt && (
              <Property label="Completed">
                <span className="text-[12px] text-status-done">{formatLong(task.completedAt)}</span>
              </Property>
            )}
          </div>

          <div className="h-px bg-border" />

          <MarkdownEditor
            key={task.id}
            value={task.description}
            onSave={(description) => updateTask(task.id, { description })}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this task?"
        description={`"${task.title}" and all of its notes will be permanently removed.`}
        onConfirm={() => {
          deleteTask(task.id)
          onClose()
        }}
      />
    </aside>
  )
}
