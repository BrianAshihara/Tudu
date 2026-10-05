import { TAG_STYLE } from "@/lib/meta"
import type { Tag } from "@/lib/types"
import { cn } from "@/lib/utils"

export function TagDot({ tag, className }: { tag: Pick<Tag, "color">; className?: string }) {
  return <span className={cn("size-2.5 shrink-0 rounded-full", TAG_STYLE[tag.color].dot, className)} />
}

export function TagPill({ tag, className }: { tag: Tag; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-40 items-center rounded-full px-2 text-[11px] leading-none font-medium",
        TAG_STYLE[tag.color].pill,
        className,
      )}
    >
      <span className="truncate">{tag.name}</span>
    </span>
  )
}

export function TagList({ tags, max = 3 }: { tags: Tag[]; max?: number }) {
  if (tags.length === 0) return null
  const hidden = tags.length - max
  return (
    <div className="flex min-w-0 items-center gap-1">
      {tags.slice(0, max).map((tag) => (
        <TagPill key={tag.id} tag={tag} />
      ))}
      {hidden > 0 && <span className="text-[11px] text-muted-foreground">+{hidden}</span>}
    </div>
  )
}

export function TagChip({ tag, className }: { tag: Tag; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-36 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 text-[11.5px] text-muted-foreground",
        className,
      )}
    >
      <TagDot tag={tag} className="size-1.5" />
      <span className="truncate">{tag.name}</span>
    </span>
  )
}
