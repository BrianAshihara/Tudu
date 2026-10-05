export type Status = "todo" | "in_progress" | "done"

export const STATUSES: Status[] = ["todo", "in_progress", "done"]

export interface Task {
  id: number
  title: string
  description: string
  status: Status
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
  tagIds?: number[]
}

export interface TaskPatch {
  title?: string
  description?: string
  status?: Status
}

export const TAG_COLORS = ["red", "orange", "yellow", "green", "blue", "purple", "gray"] as const

export type TagColor = (typeof TAG_COLORS)[number]

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
