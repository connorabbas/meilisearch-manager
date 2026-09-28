import { useMeilisearchStore } from '@/stores/meilisearch'
import type { Task, TasksOrBatchesQuery, TasksResults, DeleteOrCancelTasksQuery, TaskType, TaskStatus } from 'meilisearch'

export const TASK_TYPES = [
    'documentAdditionOrUpdate',
    'documentEdition',
    'documentDeletion',
    'settingsUpdate',
    'indexCreation',
    'indexDeletion',
    'indexUpdate',
    'indexSwap',
    'taskCancelation',
    'taskDeletion',
    'dumpCreation',
    'snapshotCreation',
    'upgradeDatabase',
    'networkTopologyChange',
    'dsrUpdate',
    'dsrClear',
] as const satisfies readonly TaskType[]

export const TASK_STATUSES = [
    'enqueued',
    'processing',
    'succeeded',
    'failed',
    'canceled',
] as const satisfies readonly TaskStatus[]

function normalizeTasksQuery(params?: TasksOrBatchesQuery): TasksOrBatchesQuery {
    const normalized: TasksOrBatchesQuery = {
        ...params,
    }

    delete normalized.from

    if (normalized.statuses?.length === 0) {
        delete normalized.statuses
    }
    if (normalized.indexUids?.length === 0) {
        delete normalized.indexUids
    }
    if (normalized.types?.length === 0) {
        delete normalized.types
    }
    if (normalized.reverse == null) {
        delete normalized.reverse
    }

    return normalized
}

function getTasksQueryKey(params?: TasksOrBatchesQuery): string {
    return JSON.stringify(normalizeTasksQuery(params))
}

function appendFetchedTasks(existingTasks: Task[], incomingTasks: Task[]): Task[] {
    const incomingTasksByUid = new Map(incomingTasks.map(task => [task.uid, task]))
    const existingUids = new Set(existingTasks.map(task => task.uid))

    return [
        ...existingTasks.map(task => incomingTasksByUid.get(task.uid) ?? task),
        ...incomingTasks.filter(task => !existingUids.has(task.uid)),
    ]
}

export function useTasks() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const tasksResults = ref<TasksResults | null>(null)
    const tasks = ref<Task[]>([])
    const isFetching = ref(false)
    const isPollingLatest = ref(false)
    const checkingTaskStatus = ref(false)
    const error = ref<string | null>(null)
    const hasMore = ref(false)
    const currentQuery = ref<TasksOrBatchesQuery>({})
    const nextCursor = ref<TasksResults['next']>(null)
    const deleteTasksQuery = ref<DeleteOrCancelTasksQuery>({})
    const isDeletingTasks = ref(false)
    let listRequestVersion = 0

    async function fetchTasks(params?: TasksOrBatchesQuery): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        const query = normalizeTasksQuery(params ?? currentQuery.value)
        const queryKey = getTasksQueryKey(query)
        const requestVersion = ++listRequestVersion
        currentQuery.value = query

        isFetching.value = true
        error.value = null

        try {
            const results = await client.tasks.getTasks(query)

            if (requestVersion !== listRequestVersion || getTasksQueryKey(currentQuery.value) !== queryKey) {
                return results
            }

            tasksResults.value = results

            tasks.value = results.results
            nextCursor.value = results.next
            hasMore.value = results.next !== null
            return results
        } catch (err) {
            if (requestVersion === listRequestVersion) {
                tasksResults.value = null
                tasks.value = []
                nextCursor.value = null
                hasMore.value = false
                error.value = (err as Error).message
            }
        } finally {
            if (requestVersion === listRequestVersion) {
                isFetching.value = false
            }
        }
    }

    async function fetchAndAppendTasks(params?: TasksOrBatchesQuery): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        if (isFetching.value || nextCursor.value === null) {
            return
        }

        const query = normalizeTasksQuery(params ?? currentQuery.value)
        const queryKey = getTasksQueryKey(query)
        const requestVersion = ++listRequestVersion
        currentQuery.value = query

        isFetching.value = true
        error.value = null

        try {
            const results = await client.tasks.getTasks({
                ...query,
                from: nextCursor.value,
            })

            if (requestVersion !== listRequestVersion || getTasksQueryKey(currentQuery.value) !== queryKey) {
                return results
            }

            tasksResults.value = results
            tasks.value = appendFetchedTasks(tasks.value, results.results)
            nextCursor.value = results.next
            hasMore.value = results.next !== null

            return results
        } catch (err) {
            if (requestVersion === listRequestVersion) {
                error.value = (err as Error).message
            }
        } finally {
            if (requestVersion === listRequestVersion) {
                isFetching.value = false
            }
        }
    }

    async function pollLatestTasks(params?: TasksOrBatchesQuery): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            return
        }

        if (isFetching.value || isPollingLatest.value) {
            return
        }

        const query = normalizeTasksQuery(params ?? currentQuery.value)
        const queryKey = getTasksQueryKey(query)
        const requestVersion = listRequestVersion
        const loadedTasksCount = Math.max(query.limit ?? 0, tasks.value.length)

        isPollingLatest.value = true

        try {
            const results = await client.tasks.getTasks({
                ...query,
                ...(loadedTasksCount > 0 ? { limit: loadedTasksCount } : {}),
            })

            if (requestVersion !== listRequestVersion || getTasksQueryKey(currentQuery.value) !== queryKey) {
                return results
            }

            tasksResults.value = results
            tasks.value = results.results
            nextCursor.value = results.next
            hasMore.value = results.next !== null
            return results
        } catch (err) {
            console.error('Failed to poll tasks', err)
        } finally {
            isPollingLatest.value = false
        }
    }

    async function pollTaskStatus(
        taskUid: number,
        taskEnqueuedMessage: string,
        successMessage: string,
        maxAttempts = 30,
        delayMs = 500
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        checkingTaskStatus.value = true
        let attempts = 0
        let taskToast: ReturnType<typeof toast.add> | undefined
        let cancellationRequested = false
        try {
            taskToast = toast.add({
                color: 'neutral',
                icon: 'i-lucide-loader-circle',
                title: 'Task Enqueued',
                description: taskEnqueuedMessage,
                duration: 0,
                progress: false,
                ui: { icon: 'motion-safe:animate-spin' },
                actions: [{
                    label: 'Cancel task',
                    color: 'error',
                    variant: 'outline',
                    onClick: async () => {
                        if (cancellationRequested) return
                        cancellationRequested = true
                        try {
                            await client.tasks.cancelTasks({ uids: [taskUid] })
                            toast.add({
                                color: 'warning',
                                icon: 'i-lucide-ban',
                                title: 'Task cancellation requested',
                                description: `Cancellation requested for task ${taskUid}.`,
                                duration: 5000,
                            })
                        } catch (err) {
                            cancellationRequested = false
                            toast.add({
                                color: 'error',
                                icon: 'i-lucide-circle-x',
                                title: 'Unable to cancel task',
                                description: (err as Error).message,
                                duration: 7500,
                            })
                        }
                    },
                }],
            })
            // Give the user time to read the enqueued task notice.
            await new Promise(resolve => setTimeout(resolve, 3000))
            while (attempts < maxAttempts) {
                const taskResponse = await client.tasks.getTask(taskUid)
                if (!taskResponse || typeof taskResponse.status === 'undefined') {
                    throw new Error('Invalid task response received')
                }
                if (taskResponse.status === 'succeeded') {
                    toast.add({
                        color: 'success',
                        icon: 'i-lucide-circle-check',
                        title: 'Task Succeeded',
                        description: successMessage,
                        duration: 5000,
                    })
                    return taskResponse
                }
                if (taskResponse.status === 'failed') {
                    console.error('Task Failed', taskResponse.error?.message)
                    throw new Error(taskResponse.error?.message ? `Task Failed: ${taskResponse.error.message}` : 'Task failed.')
                }
                if (taskResponse.status === 'canceled') {
                    toast.add({
                        id: `task-cancelled-${taskUid}`,
                        color: 'info',
                        icon: 'i-lucide-ban',
                        title: 'Task cancelled',
                        description: `Task ${taskUid} was cancelled successfully.`,
                        duration: 5000,
                    })
                    return taskResponse
                }
                if (taskResponse.status === 'enqueued' || taskResponse.status === 'processing') {
                    attempts++
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                    continue
                }
                throw new Error(`Unknown task status: ${taskResponse.status}`)
            }
            toast.add({
                color: 'warning',
                icon: 'i-lucide-list-todo',
                title: 'Task is still running',
                description: 'Polling timed out. Check the Tasks view for the latest status.',
                duration: 10000,
                actions: [{
                    label: 'Open Tasks',
                    color: 'neutral',
                    variant: 'outline',
                    onClick: () => { void navigateTo('/tasks') },
                }],
            })
            return
        } finally {
            checkingTaskStatus.value = false
            // Add slight delay as not to clash with potential error toasts
            setTimeout(() => {
                if (taskToast) {
                    toast.remove(taskToast.id)
                }
            }, 100)
        }
    }

    async function fetchTask(taskUid: number): Promise<Task> {
        const client = meilisearchStore.getClient()
        if (!client) {
            throw new Error('Meilisearch client not connected')
        }

        return await client.tasks.getTask(taskUid)
    }

    async function cancelTask(taskUid: number): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Unable to cancel task',
                description: 'Meilisearch client not connected',
                duration: 7500,
            })
            return
        }

        try {
            const latestTask = await client.tasks.getTask(taskUid)
            if (latestTask.status !== 'processing') {
                toast.add({
                    color: 'info',
                    icon: 'i-lucide-list-checks',
                    title: 'Task is no longer processing',
                    description: `Task ${taskUid} is currently ${latestTask.status}.`,
                    duration: 5000,
                })
                return latestTask
            }

            await client.tasks.cancelTasks({ uids: [taskUid] })
            toast.add({
                color: 'warning',
                icon: 'i-lucide-ban',
                title: 'Task cancellation requested',
                description: `Cancellation requested for task ${taskUid}.`,
                duration: 5000,
            })
            return await client.tasks.getTask(taskUid)
        } catch (err) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Unable to cancel task',
                description: (err as Error).message,
                duration: 7500,
            })
        }
    }

    async function deleteTasks(): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isDeletingTasks.value = true
        error.value = null

        try {
            const enqueuedTask = await client.tasks.deleteTasks(deleteTasksQuery.value)

            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A delete tasks job has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                'Tasks matching the filter have been successfully deleted',
            )

            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isDeletingTasks.value = false
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Task Error',
                description: newError,
                duration: 7500,
            })
        }
    })

    return {
        error,
        tasksResults,
        tasks,
        isFetching,
        isPollingLatest,
        hasMore,
        checkingTaskStatus,
        deleteTasksQuery,
        isDeletingTasks,
        fetchTasks,
        fetchAndAppendTasks,
        pollLatestTasks,
        pollTaskStatus,
        fetchTask,
        cancelTask,
        deleteTasks,
    }
}
