import { useEffect, useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { ClearDoneButton } from "@/components/clear-done-button"
import { PriorityChip } from "@/components/priority"
import { QuickAdd } from "@/components/quick-add"
import { StatusButton, StatusIcon } from "@/components/status-icon"
import { TagList } from "@/components/tag-pill"
import { TaskMenu } from "@/components/task-menu"
import { formatRelative, plainPreview } from "@/lib/format"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Status, type Tag, type Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

type Columns = Record<Status, number[]>

function toColumns(tasks: Task[]): Columns {
  const columns: Columns = { todo: [], in_progress: [], done: [] }
  for (const task of tasks) columns[task.status].push(task.id)
  return columns
}

function positionBetween(before?: number, after?: number) {
  if (before !== undefined && after !== undefined) return (before + after) / 2
  if (before !== undefined) return before + 1
  if (after !== undefined) return after - 1
  return 1
}

function TaskCard({
  task,
  tags,
  selected,
  overlay,
  onSelect,
}: {
  task: Task
  tags: Tag[]
  selected?: boolean
  overlay?: boolean
  onSelect?: () => void
}) {
  const { updateTask } = useTudu()
  const done = task.status === "done"
  const preview = plainPreview(task.description)

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-default flex-col gap-2 rounded-lg bg-card p-3 shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.06)] transition-[box-shadow,transform] duration-200",
        !overlay && "animate-in fade-in zoom-in-[0.98] hover:-translate-y-px hover:shadow-[0_0_0_1px_var(--border),0_4px_12px_rgb(0_0_0/0.08)]",
        selected && "shadow-[0_0_0_2px_var(--primary)] hover:shadow-[0_0_0_2px_var(--primary),0_4px_12px_rgb(0_0_0/0.08)]",
        overlay && "rotate-2 scale-[1.02] shadow-[0_0_0_1px_var(--border),0_12px_28px_rgb(0_0_0/0.18)]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <StatusButton
          status={task.status}
          completedAt={task.completedAt}
          onChange={(status) => updateTask(task.id, { status })}
          className="mt-px"
        />
        <span
          className={cn(
            "line-clamp-3 min-w-0 flex-1 leading-[18px] font-medium",
            done && "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {task.title}
        </span>
        <TaskMenu task={task} className="-mt-0.5 -mr-1 opacity-0 group-hover:opacity-100 data-popup-open:opacity-100" />
      </div>
      {preview && <p className="line-clamp-2 pl-6.5 text-[12px] leading-4 text-muted-foreground">{preview}</p>}
      <div className="flex items-center gap-2 pl-6.5">
        {!done && <PriorityChip priority={task.priority} compact />}
        <TagList tags={tags} max={2} />
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
          {formatRelative(task.updatedAt)}
        </span>
      </div>
    </div>
  )
}

function SortableCard(props: React.ComponentProps<typeof TaskCard>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("outline-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard {...props} />
    </div>
  )
}

function Column({
  status,
  tasks,
  tagsOf,
  selectedId,
  onSelect,
  defaultTagIds,
}: {
  status: Status
  tasks: Task[]
  tagsOf: (task: Task) => Tag[]
  selectedId: number | null
  onSelect: (id: number) => void
  defaultTagIds?: number[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={cn(
        "flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-muted transition-colors duration-200 dark:bg-white/4",
        isOver && "bg-primary/6 dark:bg-primary/10",
      )}
    >
      <div className="group/header flex h-10 shrink-0 items-center gap-2 px-3">
        <StatusIcon status={status} className="size-3.5" />
        <span className="text-[13px] font-semibold">{STATUS_LABEL[status]}</span>
        <span key={tasks.length} className="inline-block animate-pop text-[12px] text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
        {status === "done" && (
          <ClearDoneButton
            tasks={tasks}
            className="-mr-1.5 ml-auto opacity-0 transition-opacity duration-150 group-hover/header:opacity-100 focus-visible:opacity-100"
          />
        )}
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-12 flex-col gap-2 overflow-y-auto px-2 pt-0.5 pb-2">
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              tags={tagsOf(task)}
              selected={task.id === selectedId}
              onSelect={() => onSelect(task.id)}
            />
          ))}
        </div>
      </SortableContext>
      <div className="shrink-0 px-2 pb-2">
        <QuickAdd status={status} tagIds={defaultTagIds} placeholder="Add task" className="h-8" />
      </div>
    </div>
  )
}

export function BoardView({
  tasks,
  statuses,
  tagsById,
  defaults,
  selectedId,
  onSelect,
}: {
  tasks: Task[]
  statuses: Status[]
  tagsById: Map<number, Tag>
  defaults: { tagIds?: number[] }
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const { moveTask } = useTudu()
  const [columns, setColumns] = useState(() => toColumns(tasks))
  const [activeId, setActiveId] = useState<number | null>(null)
  const byId = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks])

  useEffect(() => {
    if (activeId === null) setColumns(toColumns(tasks))
  }, [tasks, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const tagsOf = (task: Task) => task.tagIds.flatMap((id) => tagsById.get(id) ?? [])

  const findColumn = (id: UniqueIdentifier, source: Columns = columns): Status | undefined => {
    if (typeof id === "string") return STATUSES.find((status) => status === id)
    return STATUSES.find((status) => source[status].includes(id as number))
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setColumns((current) => {
      const from = findColumn(active.id, current)
      const to = findColumn(over.id, current)
      if (!from || !to || from === to) return current
      const target = [...current[to]]
      const overIndex = target.indexOf(over.id as number)
      target.splice(overIndex >= 0 ? overIndex : target.length, 0, active.id as number)
      return { ...current, [from]: current[from].filter((id) => id !== active.id), [to]: target }
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const id = active.id as number
    const column = findColumn(id)
    setActiveId(null)
    if (!over || !column) return

    let items = columns[column]
    const from = items.indexOf(id)
    const to = items.indexOf(over.id as number)
    if (to >= 0 && to !== from) items = arrayMove(items, from, to)
    setColumns((current) => ({ ...current, [column]: items }))

    const index = items.indexOf(id)
    const position = positionBetween(byId.get(items[index - 1])?.position, byId.get(items[index + 1])?.position)
    const task = byId.get(id)
    if (task && (task.status !== column || task.position !== position)) moveTask(id, column, position)
  }

  const activeTask = activeId === null ? undefined : byId.get(activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id as number)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full items-start gap-3 overflow-x-auto px-6 pt-3 pb-6">
        {statuses.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status].flatMap((id) => byId.get(id) ?? [])}
            tagsOf={tagsOf}
            selectedId={selectedId}
            onSelect={onSelect}
            defaultTagIds={defaults.tagIds}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeTask && <TaskCard task={activeTask} tags={tagsOf(activeTask)} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
