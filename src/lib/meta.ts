import type { Status, TagColor } from "@/lib/types"

export const STATUS_LABEL: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
}

export const STATUS_COLOR: Record<Status, string> = {
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  done: "bg-status-done",
}

export const TAG_STYLE: Record<TagColor, { dot: string; pill: string }> = {
  red: { dot: "bg-[#ff3b30]", pill: "bg-[#ff3b30]/12 text-[#d70015] dark:text-[#ff6961]" },
  orange: { dot: "bg-[#ff9500]", pill: "bg-[#ff9500]/14 text-[#c93400] dark:text-[#ffb340]" },
  yellow: { dot: "bg-[#ffcc00]", pill: "bg-[#ffcc00]/20 text-[#946800] dark:text-[#ffd426]" },
  green: { dot: "bg-[#34c759]", pill: "bg-[#34c759]/14 text-[#248a3d] dark:text-[#30db5b]" },
  blue: { dot: "bg-[#007aff]", pill: "bg-[#007aff]/12 text-[#0040dd] dark:text-[#409cff]" },
  purple: { dot: "bg-[#af52de]", pill: "bg-[#af52de]/12 text-[#8944ab] dark:text-[#da8fff]" },
  gray: { dot: "bg-[#8e8e93]", pill: "bg-[#8e8e93]/14 text-[#636366] dark:text-[#aeaeb2]" },
}

export function nextStatus(status: Status): Status {
  return status === "done" ? "todo" : "done"
}
