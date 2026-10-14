import { TAG_STYLE, isPresetColor } from "@/lib/meta"
import type { Tag, TagColor } from "@/lib/types"
import { cn } from "@/lib/utils"

function dotProps(color: TagColor) {
  return isPresetColor(color)
    ? { className: TAG_STYLE[color].dot }
    : { style: { backgroundColor: color } }
}

function pillProps(color: TagColor) {
  return isPresetColor(color)
    ? { className: TAG_STYLE[color].pill }
    : {
        style: {
          backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
          color: `color-mix(in srgb, ${color} 70%, var(--foreground))`,
        },
      }
}

export function TagDot({
  tag,
  className,
  children,
}: {
  tag: Pick<Tag, "color">
  className?: string
  children?: React.ReactNode
}) {
  const { className: colorClass, style } = dotProps(tag.color)
  return (
    <span
      style={style}
      className={cn("size-2.5 shrink-0 rounded-full transition-colors duration-300", colorClass, className)}
    >
      {children}
    </span>
  )
}

export function TagPill({ tag, className }: { tag: Tag; className?: string }) {
  const { className: colorClass, style } = pillProps(tag.color)
  return (
    <span
      style={style}
      className={cn(
        "inline-flex h-5 max-w-40 items-center rounded-full px-2 text-[11px] leading-none font-medium transition-colors duration-300",
        colorClass,
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
