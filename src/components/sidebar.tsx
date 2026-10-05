import { useMemo, useState } from "react"
import { Check, Circle, CircleDashed, Inbox, Monitor, Moon, MoreHorizontal, Plus, Sun } from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { SegmentedControl } from "@/components/segmented-control"
import { TagDot } from "@/components/tag-pill"
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
import type { Theme } from "@/hooks/use-theme"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, TAG_COLORS, type Filter, type Tag, type TagColor } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

const SMART_TINT = {
  all: "bg-[#5e5ce6]",
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  done: "bg-status-done",
}

const SMART_ICON = {
  todo: <Circle className="size-3.5" strokeWidth={2.5} />,
  in_progress: <CircleDashed className="size-3.5" strokeWidth={2.5} />,
  done: <Check className="size-3.5" strokeWidth={3} />,
}

function SmartCard({
  active,
  label,
  count,
  icon,
  tint,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  icon: React.ReactNode
  tint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 rounded-[10px] p-2 text-left transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-black/5 hover:bg-black/8 dark:bg-white/7 dark:hover:bg-white/10",
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-white",
            active ? "bg-white/25" : tint,
          )}
        >
          {icon}
        </span>
        <span className="text-[19px] leading-6 font-semibold tabular-nums">{count}</span>
      </div>
      <span className={cn("text-[12px] font-medium", active ? "text-white/90" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  )
}

function TagRow({
  tag,
  count,
  active,
  onSelect,
}: {
  tag: Tag
  count: number
  active: boolean
  onSelect: () => void
}) {
  const { updateTag, deleteTag } = useTudu()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [confirming, setConfirming] = useState(false)

  const commit = () => {
    setEditing(false)
    const trimmed = name.trim()
    if (trimmed && trimmed !== tag.name) updateTag(tag.id, { name: trimmed, color: tag.color })
    else setName(tag.name)
  }

  return (
    <div
      className={cn(
        "group flex h-7 items-center gap-2 rounded-md px-2 transition-colors",
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
      )}
    >
      <TagDot tag={tag} />
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit()
            if (event.key === "Escape") {
              setName(tag.name)
              setEditing(false)
            }
          }}
          className="h-5 min-w-0 flex-1 rounded-sm bg-background px-1 text-[13px] outline-none ring-2 ring-ring"
        />
      ) : (
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-left">
          {tag.name}
        </button>
      )}
      <span className="text-[12px] text-muted-foreground tabular-nums group-hover:hidden">{count || ""}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Tag options"
          className="hidden size-5 items-center justify-center rounded-sm text-muted-foreground group-hover:flex hover:bg-black/8 data-popup-open:flex dark:hover:bg-white/10"
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>Rename</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Color</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-36">
              <DropdownMenuRadioGroup
                value={tag.color}
                onValueChange={(color) => updateTag(tag.id, { name: tag.name, color: color as TagColor })}
              >
                {TAG_COLORS.map((color) => (
                  <DropdownMenuRadioItem key={color} value={color} className="capitalize">
                    <TagDot tag={{ color }} />
                    {color}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete "${tag.name}"?`}
        description="The tag will be removed from every task. The tasks themselves are kept."
        onConfirm={() => deleteTag(tag.id)}
      />
    </div>
  )
}

function NewTagInput({ onDone }: { onDone: () => void }) {
  const { tags, createTag } = useTudu()
  const [name, setName] = useState("")

  const submit = async () => {
    const trimmed = name.trim()
    if (trimmed) await createTag({ name: trimmed, color: TAG_COLORS[tags.length % TAG_COLORS.length] })
    onDone()
  }

  return (
    <div className="flex h-7 items-center gap-2 px-2">
      <TagDot tag={{ color: TAG_COLORS[tags.length % TAG_COLORS.length] }} />
      <input
        autoFocus
        placeholder="New tag"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={submit}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit()
          if (event.key === "Escape") onDone()
        }}
        className="h-5 min-w-0 flex-1 rounded-sm bg-background px-1 text-[13px] outline-none ring-2 ring-ring"
      />
    </div>
  )
}

export function Sidebar({
  filter,
  onFilterChange,
  theme,
  onThemeChange,
}: {
  filter: Filter
  onFilterChange: (filter: Filter) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}) {
  const { tasks, tags } = useTudu()
  const [addingTag, setAddingTag] = useState(false)

  const counts = useMemo(() => {
    const byStatus = { todo: 0, in_progress: 0, done: 0 }
    const byTag = new Map<number, number>()
    for (const task of tasks) {
      byStatus[task.status] += 1
      for (const tagId of task.tagIds) byTag.set(tagId, (byTag.get(tagId) ?? 0) + 1)
    }
    return { byStatus, byTag }
  }, [tasks])

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div data-tauri-drag-region className="flex h-13 shrink-0 items-center gap-2 px-4">
        <span className="flex size-6 items-center justify-center rounded-[7px] bg-linear-to-b from-[#3b9bff] to-[#0060df] text-white shadow-sm">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span data-tauri-drag-region className="text-[14px] font-semibold tracking-tight">
          Tudu
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3">
        <SmartCard
          label="All"
          count={tasks.length}
          icon={<Inbox className="size-3.5" />}
          tint={SMART_TINT.all}
          active={filter.kind === "all"}
          onClick={() => onFilterChange({ kind: "all" })}
        />
        {STATUSES.map((status) => (
          <SmartCard
            key={status}
            label={STATUS_LABEL[status]}
            count={counts.byStatus[status]}
            icon={SMART_ICON[status]}
            tint={SMART_TINT[status]}
            active={filter.kind === "status" && filter.status === status}
            onClick={() => onFilterChange({ kind: "status", status })}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between px-4 pb-1">
        <span className="text-[11px] font-semibold text-muted-foreground">Tags</span>
        <button
          type="button"
          aria-label="New tag"
          title="New tag"
          onClick={() => setAddingTag(true)}
          className="flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 pb-2">
        {tags.map((tag) => (
          <TagRow
            key={tag.id}
            tag={tag}
            count={counts.byTag.get(tag.id) ?? 0}
            active={filter.kind === "tag" && filter.tagId === tag.id}
            onSelect={() => onFilterChange({ kind: "tag", tagId: tag.id })}
          />
        ))}
        {addingTag && <NewTagInput onDone={() => setAddingTag(false)} />}
        {tags.length === 0 && !addingTag && (
          <button
            type="button"
            onClick={() => setAddingTag(true)}
            className="px-2 py-1 text-left text-[12px] text-muted-foreground hover:text-foreground"
          >
            Create a tag to group tasks
          </button>
        )}
      </nav>

      <div className="flex shrink-0 items-center justify-center border-t border-sidebar-border p-2.5">
        <SegmentedControl
          value={theme}
          onChange={onThemeChange}
          className="w-full [&>button]:flex-1"
          options={[
            { value: "system", label: <Monitor className="size-3.5" />, title: "System" },
            { value: "light", label: <Sun className="size-3.5" />, title: "Light" },
            { value: "dark", label: <Moon className="size-3.5" />, title: "Dark" },
          ]}
        />
      </div>
    </aside>
  )
}
