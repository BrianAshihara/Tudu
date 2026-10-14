import { useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw, X } from "lucide-react"

import { BoardView } from "@/components/board-view"
import { ListView } from "@/components/list-view"
import { NewTaskDialog } from "@/components/new-task-dialog"
import { Sidebar } from "@/components/sidebar"
import { TaskDetail } from "@/components/task-detail"
import { Toolbar } from "@/components/toolbar"
import { WindowControls } from "@/components/window-controls"
import { useStoredState } from "@/hooks/use-stored-state"
import { useTheme } from "@/hooks/use-theme"
import { STATUS_LABEL } from "@/lib/meta"
import { STATUSES, type Filter, type Priority, type Task, type ViewMode } from "@/lib/types"
import { cn } from "@/lib/utils"
import { UNDO_DELAY, useTudu } from "@/store/tudu-store"

const VIEWS: ViewMode[] = ["list", "board"]

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA"].includes(target.tagName))
}

export default function App() {
  const { tasks, tags, loading, error, dismissError, pendingDelete, undoDelete } = useTudu()
  const [theme, setTheme] = useTheme()
  const [view, setView] = useStoredState<ViewMode>("tudu.view", "list", VIEWS)
  const [filter, setFilter] = useState<Filter>({ kind: "all" })
  const [search, setSearch] = useState("")
  const [priorities, setPriorities] = useState<Priority[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [creating, setCreating] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const tagsById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])
  const activeTag = filter.kind === "tag" ? tagsById.get(filter.tagId) : undefined
  const selected = tasks.find((task) => task.id === selectedId)

  useEffect(() => {
    if (filter.kind === "tag" && !activeTag && !loading) setFilter({ kind: "all" })
  }, [filter, activeTag, loading])

  useEffect(() => {
    if (!selected) setExpanded(false)
  }, [selected])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks
      .filter((task) => {
        if (filter.kind === "status" && task.status !== filter.status) return false
        if (filter.kind === "tag" && !task.tagIds.includes(filter.tagId)) return false
        if (priorities.length > 0 && !priorities.includes(task.priority)) return false
        if (!query) return true
        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.priority.includes(query) ||
          task.tagIds.some((id) => tagsById.get(id)?.name.toLowerCase().includes(query))
        )
      })
      .sort((a, b) => a.position - b.position || a.id - b.id)
  }, [tasks, filter, search, priorities, tagsById])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey
      if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault()
        setCreating(true)
      } else if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (mod && event.key.toLowerCase() === "z" && !isTyping(event.target)) {
        event.preventDefault()
        undoDelete()
      } else if (event.key === "Escape" && !isTyping(event.target) && !document.querySelector("[role=dialog]")) {
        setSelectedId(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [undoDelete])

  const statuses = filter.kind === "status" ? [filter.status] : STATUSES
  const defaults = {
    status: filter.kind === "status" ? filter.status : undefined,
    tagIds: filter.kind === "tag" ? [filter.tagId] : undefined,
  }
  const title =
    filter.kind === "status" ? STATUS_LABEL[filter.status] : filter.kind === "tag" ? (activeTag?.name ?? "") : "All Tasks"
  const remaining = visible.filter((task) => task.status !== "done").length
  const subtitle = `${visible.length} ${visible.length === 1 ? "task" : "tasks"}, ${remaining} open`

  const select = (id: number) => setSelectedId((current) => (current === id && !expanded ? null : id))
  const openCreated = (task: Task) => setSelectedId(task.id)

  const content = view === "list" ? (
    <ListView
      title={title}
      showTagFilter={filter.kind !== "tag"}
      tasks={visible}
      statuses={statuses}
      tagsById={tagsById}
      defaults={defaults}
      selectedId={selectedId}
      onSelect={select}
    />
  ) : (
    <BoardView
      tasks={visible}
      statuses={statuses}
      tagsById={tagsById}
      defaults={defaults}
      selectedId={selectedId}
      onSelect={select}
    />
  )

  return (
    <div className="flex h-full">
      <Sidebar
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next)
          setExpanded(false)
        }}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex min-w-0 flex-1">
        {!expanded && (
          <div className="flex min-w-0 flex-1 flex-col">
            <Toolbar
              ref={searchRef}
              title={view === "board" ? title : undefined}
              subtitle={view === "board" ? subtitle : undefined}
              reserveControls={!selected}
              view={view}
              onViewChange={setView}
              search={search}
              onSearchChange={setSearch}
              priorities={priorities}
              onPrioritiesChange={setPriorities}
              onNewTask={() => setCreating(true)}
            />
            <div key={view} className="min-h-0 flex-1 animate-in fade-in duration-300">
              {loading ? null : content}
            </div>
          </div>
        )}
        {selected && (
          <div
            className={cn(
              "flex min-w-0 animate-in fade-in slide-in-from-right-6 duration-250 ease-out",
              expanded ? "flex-1" : "shrink-0",
            )}
          >
            <TaskDetail
              key={selected.id}
              task={selected}
              expanded={expanded}
              onToggleExpanded={() => setExpanded((value) => !value)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </main>

      <WindowControls className="fixed top-0 right-0 z-40" />

      <NewTaskDialog open={creating} onOpenChange={setCreating} defaults={defaults} onCreated={openCreated} />

      <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex w-max max-w-md -translate-x-1/2 flex-col items-center gap-2">
        {pendingDelete && (
          <div
            key={pendingDelete.id}
            className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-lg bg-foreground py-2 pr-2 pl-4 text-[13px] text-background shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <span>
              {pendingDelete.count === 1 ? "Task deleted" : `${pendingDelete.count} tasks deleted`}
            </span>
            <button
              type="button"
              onClick={undoDelete}
              title="Undo (Ctrl+Z)"
              className="flex h-7 items-center gap-1.5 rounded-md px-2.5 font-semibold text-[#4da3ff] transition-colors hover:bg-background/12 dark:text-[#0a84ff]"
            >
              <RotateCcw className="size-3.5" />
              Undo
            </button>
            <span
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shrink bg-background/30"
              style={{ animationDuration: `${UNDO_DELAY}ms` }}
            />
          </div>
        )}
        {error && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-foreground px-4 py-2.5 text-[13px] text-background shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300">
            <span className="min-w-0 flex-1">{error}</span>
            <button type="button" aria-label="Dismiss" onClick={dismissError} className="opacity-70 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
