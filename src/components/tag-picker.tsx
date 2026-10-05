import { useState } from "react"
import { Check, Plus } from "lucide-react"

import { TagDot, TagPill } from "@/components/tag-pill"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TAG_COLORS, type Task } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

export function TagPicker({ task }: { task: Task }) {
  const { tags, createTag, setTaskTags } = useTudu()
  const [query, setQuery] = useState("")

  const selected = tags.filter((tag) => task.tagIds.includes(tag.id))
  const search = query.trim().toLowerCase()
  const visible = tags.filter((tag) => tag.name.toLowerCase().includes(search))
  const exact = tags.find((tag) => tag.name.toLowerCase() === search)

  const toggle = (tagId: number) => {
    const next = task.tagIds.includes(tagId)
      ? task.tagIds.filter((id) => id !== tagId)
      : [...task.tagIds, tagId]
    setTaskTags(task.id, next)
  }

  const submit = async () => {
    if (!search) return
    if (exact) {
      toggle(exact.id)
    } else {
      const tag = await createTag({ name: query.trim(), color: TAG_COLORS[tags.length % TAG_COLORS.length] })
      if (tag) setTaskTags(task.id, [...task.tagIds, tag.id])
    }
    setQuery("")
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {selected.map((tag) => (
        <TagPill key={tag.id} tag={tag} />
      ))}
      <Popover onOpenChange={(open) => !open && setQuery("")}>
        <PopoverTrigger
          className="flex h-5 items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground data-popup-open:bg-accent"
        >
          <Plus className="size-3" />
          {selected.length === 0 ? "Add tag" : "Edit"}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 gap-1 p-1.5">
          <input
            autoFocus
            value={query}
            placeholder="Search or create tag"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            className="h-7 w-full rounded-md bg-muted px-2 text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <div className="flex max-h-56 flex-col overflow-y-auto">
            {visible.map((tag) => {
              const checked = task.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className="flex h-7 items-center gap-2 rounded-md px-2 text-left text-[13px] hover:bg-accent"
                >
                  <TagDot tag={tag} />
                  <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                  <Check className={cn("size-3.5 text-primary", !checked && "invisible")} />
                </button>
              )
            })}
            {search && !exact && (
              <button
                type="button"
                onClick={submit}
                className="flex h-7 items-center gap-2 rounded-md px-2 text-left text-[13px] text-primary hover:bg-accent"
              >
                <Plus className="size-3.5" />
                <span className="truncate">Create "{query.trim()}"</span>
              </button>
            )}
            {tags.length === 0 && !search && (
              <p className="px-2 py-1.5 text-[12px] text-muted-foreground">Type a name to create your first tag</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
