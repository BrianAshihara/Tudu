import { useState } from "react"
import { ChevronDown, ChevronRight, Clock, FileText, Plus, Tag as TagIcon } from "lucide-react"

import { ClearDoneButton } from "@/components/clear-done-button"
import { PriorityChip, PriorityPicker } from "@/components/priority"
import { StatusButton, StatusIcon } from "@/components/status-icon"
import { TagChip, TagDot } from "@/components/tag-pill"
import { TaskMenu } from "@/components/task-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelative } from "@/lib/format"
import { PRIORITY_RANK, STATUS_LABEL } from "@/lib/meta"
import type { Priority, Status, Tag, Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

const GROUP_ORDER: Status[] = ["in_progress", "todo", "done"]

const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })

const pickerClass =
  "flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent data-popup-open:bg-accent"

function Composer({ defaults }: { defaults: { status?: Status; tagIds?: number[] } }) {
  const { tags, createTask } = useTudu()
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<Status>(defaults.status ?? "todo")
  const [tagId, setTagId] = useState<number | null>(defaults.tagIds?.[0] ?? null)
  const [priority, setPriority] = useState<Priority>("normal")
  const tag = tags.find((item) => item.id === tagId)

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setTitle("")
    setPriority("normal")
    await createTask({ title: trimmed, status, priority, tagIds: tag ? [tag.id] : undefined })
  }

  return (
    <div className="@container flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgb(0_122_255/0.1)]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Plus className="size-4" strokeWidth={2.5} />
      </span>
      <input
        value={title}
        placeholder="Add a task and press Enter..."
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit()
          if (event.key === "Escape") {
            setTitle("")
            event.currentTarget.blur()
          }
        }}
        className="h-8 min-w-0 flex-1 bg-transparent px-1 text-[13.5px] outline-none placeholder:text-muted-foreground"
      />

      <DropdownMenu>
        <DropdownMenuTrigger className={pickerClass}>
          <StatusIcon status={status} className="size-3.5" />
          <span className="hidden @lg:inline">{STATUS_LABEL[status]}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuRadioGroup value={status} onValueChange={(value) => setStatus(value as Status)}>
            {(["todo", "in_progress", "done"] as Status[]).map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <StatusIcon status={value} className="size-3.5" />
                {STATUS_LABEL[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <PriorityPicker
        value={priority}
        onChange={setPriority}
        className={pickerClass}
        labelClassName="hidden @lg:inline"
      />

      <DropdownMenu>
        <DropdownMenuTrigger className={cn(pickerClass, "max-w-36")}>
          {tag ? <TagDot tag={tag} className="size-2" /> : <TagIcon className="size-3.5 text-muted-foreground" />}
          <span className={cn("hidden truncate @lg:inline", !tag && "text-muted-foreground")}>{tag ? tag.name : "No tag"}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end">
          <DropdownMenuRadioGroup
            value={tag ? String(tag.id) : "none"}
            onValueChange={(value) => setTagId(value === "none" ? null : Number(value))}
          >
            <DropdownMenuRadioItem value="none">No tag</DropdownMenuRadioItem>
            {tags.map((item) => (
              <DropdownMenuRadioItem key={item.id} value={String(item.id)}>
                <TagDot tag={item} className="size-2" />
                <span className="truncate">{item.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={submit}
        disabled={!title.trim()}
        className="h-8 rounded-lg bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
      >
        Add
      </button>
    </div>
  )
}

function TagFilter({
  tags,
  value,
  onChange,
}: {
  tags: Tag[]
  value: number | null
  onChange: (value: number | null) => void
}) {
  const chip = (active: boolean) =>
    cn(
      "flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors",
      active ? "bg-foreground/8 text-foreground dark:bg-white/10" : "text-muted-foreground hover:text-foreground",
    )

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      <span className="mr-2 text-[10.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Tags</span>
      <button type="button" onClick={() => onChange(null)} className={chip(value === null)}>
        All
      </button>
      {tags.map((tag) => (
        <button key={tag.id} type="button" onClick={() => onChange(tag.id)} className={chip(value === tag.id)}>
          <TagDot tag={tag} className="size-2" />
          <span className="max-w-28 truncate">{tag.name}</span>
        </button>
      ))}
    </div>
  )
}

function TaskRow({
  task,
  tags,
  selected,
  onSelect,
}: {
  task: Task
  tags: Tag[]
  selected: boolean
  onSelect: () => void
}) {
  const { updateTask } = useTudu()
  const done = task.status === "done"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => event.key === "Enter" && event.target === event.currentTarget && onSelect()}
      className={cn(
        "group @container flex h-14 cursor-default items-center gap-3.5 rounded-xl border bg-card px-3.5 outline-none transition-[border-color,background-color,box-shadow] duration-200 animate-in fade-in slide-in-from-bottom-1",
        selected
          ? "border-primary/60 bg-primary/5 dark:bg-primary/10"
          : "border-border hover:border-foreground/15 hover:shadow-[0_2px_8px_rgb(0_0_0/0.05)] focus-visible:border-primary/60",
      )}
    >
      <StatusButton
        status={task.status}
        completedAt={task.completedAt}
        onChange={(status) => updateTask(task.id, { status })}
        className="[&_svg]:size-5"
      />
      <span
        className={cn(
          "min-w-0 truncate text-[13.5px] font-medium transition-colors duration-300",
          done && "text-muted-foreground line-through decoration-muted-foreground/50",
        )}
      >
        {task.title}
      </span>
      {task.description.trim() && <FileText className="size-3.5 shrink-0 text-muted-foreground/60" />}

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {!done && <PriorityChip priority={task.priority} className="hidden @lg:inline-flex" />}
        {!done && <PriorityChip priority={task.priority} compact className="@lg:hidden" />}
        <div className="hidden items-center gap-1.5 @xl:flex">
          {tags.slice(0, 2).map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
          {tags.length > 2 && <span className="px-1 text-[11px] text-muted-foreground">+{tags.length - 2}</span>}
        </div>
        <span className="hidden h-6 items-center gap-1.5 rounded-full border border-border px-2.5 text-[11.5px] text-muted-foreground tabular-nums @md:inline-flex">
          <Clock className="size-3" />
          {formatRelative(task.updatedAt)}
        </span>
        <TaskMenu
          task={task}
          className="ml-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 data-popup-open:opacity-100"
        />
      </div>
    </div>
  )
}

function Group({
  status,
  tasks,
  tagsById,
  selectedId,
  onSelect,
  defaultOpen = status !== "done",
}: {
  status: Status
  tasks: Task[]
  tagsById: Map<number, Tag>
  selectedId: number | null
  onSelect: (id: number) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="flex flex-col">
      <div className="group/header flex h-8 items-center gap-2">
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-full flex-1 items-center gap-2 text-left">
          <span className="text-[13.5px] font-semibold">{STATUS_LABEL[status]}</span>
          <span
            key={tasks.length}
            className="flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-foreground/7 px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums dark:bg-white/8"
          >
            {tasks.length}
          </span>
          <span className="h-px flex-1 bg-border" />
          <ChevronRight
            className={cn(
              "size-3.5 text-muted-foreground opacity-60 transition-[transform,opacity] duration-200 group-hover/header:opacity-100",
              open && "rotate-90",
            )}
          />
        </button>
        {status === "done" && (
          <ClearDoneButton
            tasks={tasks}
            className="opacity-0 transition-opacity duration-150 group-hover/header:opacity-100 focus-visible:opacity-100"
          />
        )}
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-250 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="-mx-2 -mb-2 flex min-h-0 flex-col gap-2 overflow-hidden px-2 pb-2" inert={!open}>
          <div className="h-0" />
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              tags={task.tagIds.flatMap((id) => tagsById.get(id) ?? [])}
              selected={task.id === selectedId}
              onSelect={() => onSelect(task.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ListView({
  title,
  tasks,
  statuses,
  tagsById,
  defaults,
  showTagFilter,
  selectedId,
  onSelect,
}: {
  title: string
  tasks: Task[]
  statuses: Status[]
  tagsById: Map<number, Tag>
  defaults: { status?: Status; tagIds?: number[] }
  showTagFilter: boolean
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const [chipTag, setChipTag] = useState<number | null>(null)
  const tags = [...tagsById.values()]
  // The sidebar's Done card shows only completed tasks, so its group starts expanded there.
  const onlyDone = statuses.length === 1 && statuses[0] === "done"
  const activeChip = showTagFilter && chipTag !== null && tagsById.has(chipTag) ? chipTag : null
  const shown = activeChip === null ? tasks : tasks.filter((task) => task.tagIds.includes(activeChip))
  const open = shown.filter((task) => task.status !== "done").length
  const progress = shown.length === 0 ? 0 : ((shown.length - open) / shown.length) * 100
  const groups = GROUP_ORDER.filter((status) => statuses.includes(status))
    .map((status) => ({
      status,
      tasks: shown
        .filter((task) => task.status === status)
        .sort((a, b) => (status === "done" ? 0 : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])),
    }))
    .filter((group) => group.tasks.length > 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-7 pt-6 pb-12">
        <header className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">{today.format(new Date())}</p>
            <h1 className="mt-1 truncate text-[28px] leading-9 font-bold tracking-tight">{title}</h1>
          </div>
          <p className="shrink-0 pb-1 text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{open}</span> open
            <span className="mx-1.5 opacity-50">/</span>
            <span className="tabular-nums">{shown.length}</span> total
          </p>
        </header>
        <div
          className="-mt-2 h-1 overflow-hidden rounded-full bg-foreground/6 dark:bg-white/8"
          title={`${Math.round(progress)}% done`}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-[#34c759] to-[#30d158] transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Composer key={`${defaults.status}-${defaults.tagIds?.[0]}`} defaults={defaults} />

        {showTagFilter && tags.length > 0 && <TagFilter tags={tags} value={activeChip} onChange={setChipTag} />}

        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <Group
              key={onlyDone ? "done-only" : group.status}
              status={group.status}
              defaultOpen={onlyDone || undefined}
              tasks={group.tasks}
              tagsById={tagsById}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
          {groups.length === 0 && (
            <div className="flex flex-col items-center gap-1 py-16 text-center animate-in fade-in zoom-in-95 duration-300">
              <p className="text-[14px] font-semibold">Nothing here yet</p>
              <p className="text-[12.5px] text-muted-foreground">Add a task above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
