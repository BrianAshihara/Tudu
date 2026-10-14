import { useEffect, useState } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { Copy, Minus, Square, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTudu } from "@/store/tudu-store"

const buttonClass =
  "flex h-full w-11.5 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"

export function WindowControls({ className }: { className?: string }) {
  const { flushDeletes } = useTudu()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    const appWindow = getCurrentWindow()
    let active = true
    let unlisten: (() => void) | undefined
    const sync = () => appWindow.isMaximized().then((value) => active && setMaximized(value))
    sync()
    appWindow
      .onResized(sync)
      .then((stop) => (active ? (unlisten = stop) : stop()))
      .catch(() => undefined)
    return () => {
      active = false
      unlisten?.()
    }
  }, [])

  return (
    <div className={cn("flex h-13", className)}>
      <button type="button" aria-label="Minimize" title="Minimize" onClick={() => getCurrentWindow().minimize()} className={buttonClass}>
        <Minus className="size-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label={maximized ? "Restore" : "Maximize"}
        title={maximized ? "Restore" : "Maximize"}
        onClick={() => getCurrentWindow().toggleMaximize()}
        className={buttonClass}
      >
        {maximized ? (
          <Copy className="size-3.5 -scale-x-100" strokeWidth={1.5} />
        ) : (
          <Square className="size-3.5" strokeWidth={1.5} />
        )}
      </button>
      <button
        type="button"
        aria-label="Close"
        title="Close"
        onClick={() => flushDeletes().finally(() => getCurrentWindow().close())}
        className={cn(buttonClass, "hover:bg-[#e81123] hover:text-white")}
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}
