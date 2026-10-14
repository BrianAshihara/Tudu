export type Status = "todo" | "in_progress" | "done"

export const STATUSES: Status[] = ["todo", "in_progress", "done"]

export type Priority = "low" | "normal" | "high" | "emergency"

export const PRIORITIES: Priority[] = ["low", "normal", "high", "emergency"]

export interface Task {
  id: number
  title: string
  description: string
  status: Status
  priority: Priority
  position: number
  tagIds: number[]
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface NewTask {
  title: string
  description?: string
  status?: Status
  priority?: Priority
  tagIds?: number[]
}

export interface TaskPatch {
  title?: string
  description?: string
  status?: Status
  priority?: Priority
}

export const TAG_COLORS = ["red", "orange", "yellow", "green", "blue", "purple", "gray"] as const

export type PresetColor = (typeof TAG_COLORS)[number]

/** A preset color name or a custom `#rrggbb` hex value. */
export type TagColor = PresetColor | `#${string}`

export interface Tag {
  id: number
  name: string
  color: TagColor
}

export interface TagInput {
  name: string
  color: TagColor
}

export type Filter =
  | { kind: "all" }
  | { kind: "status"; status: Status }
  | { kind: "tag"; tagId: number }

export type ViewMode = "list" | "board"
