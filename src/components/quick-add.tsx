import { useState } from "react"
import { Plus } from "lucide-react"

import type { Status } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

export function QuickAdd({
  status,
  tagIds,
  placeholder = "New task",
  className,
}: {
  status?: Status
  tagIds?: number[]
  placeholder?: string
  className?: string
}) {
  const { createTask } = useTudu()
  const [title, setTitle] = useState("")

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setTitle("")
    await createTask({ title: trimmed, status, tagIds })
  }

  return (
    <label
      className={cn(
        "flex h-9 cursor-text items-center gap-2.5 rounded-md px-2 text-muted-foreground transition-colors focus-within:bg-accent/60 hover:bg-accent/60",
        className,
      )}
    >
      <Plus className="size-4 shrink-0" />
      <input
        value={title}
        placeholder={placeholder}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit()
          if (event.key === "Escape") {
            setTitle("")
            event.currentTarget.blur()
          }
        }}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  )
}
