import { invoke } from "@tauri-apps/api/core"

import type { NewTask, Status, Tag, TagInput, Task, TaskPatch } from "@/lib/types"

export const api = {
  listTasks: () => invoke<Task[]>("list_tasks"),
  createTask: (input: NewTask) => invoke<Task>("create_task", { input }),
  updateTask: (id: number, patch: TaskPatch) => invoke<Task>("update_task", { id, patch }),
  moveTask: (id: number, status: Status, position: number) =>
    invoke<Task>("move_task", { id, status, position }),
  deleteTask: (id: number) => invoke<void>("delete_task", { id }),
  setTaskTags: (taskId: number, tagIds: number[]) =>
    invoke<Task>("set_task_tags", { taskId, tagIds }),
  listTags: () => invoke<Tag[]>("list_tags"),
  createTag: (input: TagInput) => invoke<Tag>("create_tag", { input }),
  updateTag: (id: number, input: TagInput) => invoke<Tag>("update_tag", { id, input }),
  deleteTag: (id: number) => invoke<void>("delete_tag", { id }),
}
