import { useEffect, useRef, useState } from "react"
import { openUrl } from "@tauri-apps/plugin-opener"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { SegmentedControl } from "@/components/segmented-control"
import { cn } from "@/lib/utils"

type Mode = "write" | "preview"

export function MarkdownEditor({
  value,
  onSave,
  className,
}: {
  value: string
  onSave: (value: string) => void
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const [mode, setMode] = useState<Mode>(value.trim() ? "preview" : "write")
  const pending = useRef<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const save = useRef(onSave)
  save.current = onSave

  const flush = () => {
    window.clearTimeout(timer.current)
    if (pending.current !== null) {
      save.current(pending.current)
      pending.current = null
    }
  }

  useEffect(() => flush, [])

  const change = (next: string) => {
    setDraft(next)
    pending.current = next
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 500)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-muted-foreground">Notes</span>
        <SegmentedControl
          value={mode}
          onChange={(next) => {
            flush()
            setMode(next)
          }}
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </div>

      {mode === "write" ? (
        <textarea
          autoFocus={!value.trim()}
          value={draft}
          onChange={(event) => change(event.target.value)}
          onBlur={flush}
          placeholder={"Add notes, links, checklists...\n\nMarkdown is supported: # heading, **bold**, - [ ] todo"}
          className="min-h-60 w-full resize-none rounded-lg border border-input bg-transparent p-3 font-mono text-[12.5px] leading-relaxed outline-none field-sizing-content placeholder:text-muted-foreground/70 focus:border-primary focus:ring-3 focus:ring-ring/30"
        />
      ) : draft.trim() ? (
        <div
          onDoubleClick={() => setMode("write")}
          title="Double click to edit"
          className="prose prose-sm max-w-none rounded-lg px-1 py-1 select-text dark:prose-invert prose-headings:font-semibold prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:text-foreground [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-1 [&_.task-list-item_input]:mr-2 [&_.task-list-item_input]:accent-primary"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  onClick={(event) => {
                    event.preventDefault()
                    if (href) openUrl(href)
                  }}
                >
                  {children}
                </a>
              ),
            }}
          >
            {draft}
          </ReactMarkdown>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMode("write")}
          className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-input text-[12px] text-muted-foreground hover:bg-accent/50"
        >
          No notes yet. Click to write.
        </button>
      )}
    </div>
  )
}
