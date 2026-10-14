import { forwardRef } from "react"
import { Columns3, List, ListFilter, Plus, Search, X } from "lucide-react"

import { PriorityIcon } from "@/components/priority"
import { SegmentedControl } from "@/components/segmented-control"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PRIORITY_LABEL } from "@/lib/meta"
import { PRIORITIES, type Priority, type ViewMode } from "@/lib/types"
import { cn } from "@/lib/utils"

export const Toolbar = forwardRef<
  HTMLInputElement,
  {
    title?: string
    subtitle?: string
    reserveControls: boolean
    view: ViewMode
    onViewChange: (view: ViewMode) => void
    search: string
    onSearchChange: (search: string) => void
    priorities: Priority[]
    onPrioritiesChange: (priorities: Priority[]) => void
    onNewTask: () => void
  }
>(function Toolbar(
  { title, subtitle, reserveControls, view, onViewChange, search, onSearchChange, priorities, onPrioritiesChange, onNewTask },
  searchRef,
) {
  const filtering = priorities.length > 0

  return (
    <header
      data-tauri-drag-region
      className={cn(
        "flex h-13 shrink-0 items-center gap-3 border-b border-border bg-toolbar pl-5",
        reserveControls ? "pr-38" : "pr-5",
      )}
    >
      <div data-tauri-drag-region className="flex min-w-0 flex-1 items-baseline gap-2">
        {title && (
          <h1 data-tauri-drag-region className="truncate text-[15px] font-semibold">
            {title}
          </h1>
        )}
        {subtitle && (
          <span data-tauri-drag-region className="shrink-0 text-[12px] text-muted-foreground">
            {subtitle}
          </span>
        )}
      </div>

      <SegmentedControl
        value={view}
        onChange={onViewChange}
        options={[
          { value: "list", label: <List className="size-3.5" />, title: "List" },
          { value: "board", label: <Columns3 className="size-3.5" />, title: "Board" },
        ]}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          title="Filter by priority"
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors data-popup-open:bg-accent",
            filtering
              ? "bg-primary/12 text-primary hover:bg-primary/18"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <ListFilter className="size-3.5" />
          {filtering && (
            <span className="flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground tabular-nums">
              {priorities.length}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            {[...PRIORITIES].reverse().map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={priorities.includes(priority)}
                onCheckedChange={(checked) =>
                  onPrioritiesChange(checked ? [...priorities, priority] : priorities.filter((item) => item !== priority))
                }
              >
                <PriorityIcon priority={priority} className="size-3.5" />
                {PRIORITY_LABEL[priority]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          {filtering && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onPrioritiesChange([])}>Clear filter</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <label className="flex h-7 w-52 items-center gap-1.5 rounded-md bg-black/5 px-2 text-muted-foreground focus-within:ring-3 focus-within:ring-ring/40 dark:bg-white/8">
        <Search className="size-3.5 shrink-0" />
        <input
          ref={searchRef}
          value={search}
          placeholder="Search"
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onSearchChange("")
              event.currentTarget.blur()
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        {search && (
          <button type="button" aria-label="Clear search" onClick={() => onSearchChange("")}>
            <X className="size-3.5" />
          </button>
        )}
      </label>

      <button
        type="button"
        onClick={onNewTask}
        title="New task (Ctrl+N)"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus className="size-4.5" />
      </button>
    </header>
  )
})
