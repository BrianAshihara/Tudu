import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { api } from "@/lib/api"
import type { NewTask, Status, Tag, TagInput, Task, TaskPatch } from "@/lib/types"

interface TuduStore {
  tasks: Task[]
  tags: Tag[]
  loading: boolean
  error: string | null
  dismissError: () => void
  createTask: (input: NewTask) => Promise<Task | undefined>
  updateTask: (id: number, patch: TaskPatch) => Promise<void>
  moveTask: (id: number, status: Status, position: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  setTaskTags: (id: number, tagIds: number[]) => Promise<void>
  createTag: (input: TagInput) => Promise<Tag | undefined>
  updateTag: (id: number, input: TagInput) => Promise<void>
  deleteTag: (id: number) => Promise<void>
}

const TuduContext = createContext<TuduStore | null>(null)

function withStatus(task: Task, status: Status, position: number): Task {
  const now = new Date().toISOString()
  return {
    ...task,
    status,
    position,
    updatedAt: now,
    completedAt: status === "done" ? (task.completedAt ?? now) : null,
  }
}

export function TuduProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requests = useRef(new Map<number, number>())

  const reload = useCallback(async () => {
    const [nextTasks, nextTags] = await Promise.all([api.listTasks(), api.listTags()])
    setTasks(nextTasks)
    setTags(nextTags)
  }, [])

  const fail = useCallback(
    (err: unknown) => {
      setError(String(err))
      reload().catch(() => undefined)
    },
    [reload],
  )

  useEffect(() => {
    reload()
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [reload])

  const track = (id: number) => {
    const request = (requests.current.get(id) ?? 0) + 1
    requests.current.set(id, request)
    return () => requests.current.get(id) === request
  }

  const replaceTask = useCallback((task: Task) => {
    setTasks((current) => current.map((item) => (item.id === task.id ? task : item)))
  }, [])

  const patchLocal = useCallback((id: number, update: (task: Task) => Task) => {
    setTasks((current) => current.map((item) => (item.id === id ? update(item) : item)))
  }, [])

  const createTask = useCallback(
    async (input: NewTask) => {
      try {
        const task = await api.createTask(input)
        setTasks((current) => [...current, task])
        return task
      } catch (err) {
        setError(String(err))
      }
    },
    [],
  )

  const updateTask = useCallback(
    async (id: number, patch: TaskPatch) => {
      const isLatest = track(id)
      setTasks((current) => {
        const task = current.find((item) => item.id === id)
        if (!task) return current
        let next: Task = { ...task, ...patch, updatedAt: new Date().toISOString() }
        if (patch.status && patch.status !== task.status) {
          const last = current
            .filter((item) => item.status === patch.status)
            .reduce((max, item) => Math.max(max, item.position), 0)
          next = withStatus(next, patch.status, last + 1)
        }
        return current.map((item) => (item.id === id ? next : item))
      })
      try {
        const task = await api.updateTask(id, patch)
        if (isLatest()) replaceTask(task)
      } catch (err) {
        fail(err)
      }
    },
    [fail, replaceTask],
  )

  const moveTask = useCallback(
    async (id: number, status: Status, position: number) => {
      const isLatest = track(id)
      patchLocal(id, (task) => withStatus(task, status, position))
      try {
        const task = await api.moveTask(id, status, position)
        if (isLatest()) replaceTask(task)
      } catch (err) {
        fail(err)
      }
    },
    [fail, patchLocal, replaceTask],
  )

  const deleteTask = useCallback(
    async (id: number) => {
      setTasks((current) => current.filter((item) => item.id !== id))
      try {
        await api.deleteTask(id)
      } catch (err) {
        fail(err)
      }
    },
    [fail],
  )

  const setTaskTags = useCallback(
    async (id: number, tagIds: number[]) => {
      const isLatest = track(id)
      patchLocal(id, (task) => ({ ...task, tagIds }))
      try {
        const task = await api.setTaskTags(id, tagIds)
        if (isLatest()) replaceTask(task)
      } catch (err) {
        fail(err)
      }
    },
    [fail, patchLocal, replaceTask],
  )

  const createTag = useCallback(async (input: TagInput) => {
    try {
      const tag = await api.createTag(input)
      setTags((current) =>
        [...current, tag].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
      )
      return tag
    } catch (err) {
      setError(String(err))
    }
  }, [])

  const updateTag = useCallback(
    async (id: number, input: TagInput) => {
      setTags((current) => current.map((tag) => (tag.id === id ? { ...tag, ...input } : tag)))
      try {
        const tag = await api.updateTag(id, input)
        setTags((current) => current.map((item) => (item.id === id ? tag : item)))
      } catch (err) {
        fail(err)
      }
    },
    [fail],
  )

  const deleteTag = useCallback(
    async (id: number) => {
      setTags((current) => current.filter((tag) => tag.id !== id))
      setTasks((current) =>
        current.map((task) =>
          task.tagIds.includes(id) ? { ...task, tagIds: task.tagIds.filter((tagId) => tagId !== id) } : task,
        ),
      )
      try {
        await api.deleteTag(id)
      } catch (err) {
        fail(err)
      }
    },
    [fail],
  )

  const value = useMemo<TuduStore>(
    () => ({
      tasks,
      tags,
      loading,
      error,
      dismissError: () => setError(null),
      createTask,
      updateTask,
      moveTask,
      deleteTask,
      setTaskTags,
      createTag,
      updateTag,
      deleteTag,
    }),
    [tasks, tags, loading, error, createTask, updateTask, moveTask, deleteTask, setTaskTags, createTag, updateTag, deleteTag],
  )

  return <TuduContext.Provider value={value}>{children}</TuduContext.Provider>
}

export function useTudu() {
  const store = useContext(TuduContext)
  if (!store) throw new Error("useTudu must be used inside TuduProvider")
  return store
}
