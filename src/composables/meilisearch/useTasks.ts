import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useMeilisearchStore } from '@/stores/meilisearch'
import type { Task, TasksOrBatchesQuery, TasksResults } from 'meilisearch'

export function useTasks() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const tasksResults = ref<TasksResults | null>(null)
    const tasks = ref<Task[]>([])
    const isFetching = ref(false)
    const checkingTaskStatus = ref(false)
    const error = ref<string | null>(null)
    const hasMore = ref(false)

    async function fetchTasks(params?: TasksOrBatchesQuery, append = false): Promise<TasksResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'MeiliSearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.tasks.getTasks(params)
            tasksResults.value = results

            if (append) {
                tasks.value = [...tasks.value, ...results.results]
            } else {
                tasks.value = results.results
            }

            hasMore.value = !!results.next
            return results
        } catch (err) {
            if (!append) tasks.value = []
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchAndAppendTasks(params: TasksOrBatchesQuery) {
        if (!tasksResults.value?.next) return
        params.from = tasksResults.value.next
        await fetchTasks(params, true)
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
            error.value = 'MeiliSearch client not connected'
            return
        }

        const taskToastOptions = {
            severity: 'secondary',
            summary: 'Task Enqueued',
            detail: taskEnqueuedMessage,
        }

        checkingTaskStatus.value = true
        let attempts = 0
        try {
            toast.add(taskToastOptions)
            // Wait just a moment to show the task enqueued toast
            await new Promise(resolve => setTimeout(resolve, 1500))
            while (attempts < maxAttempts) {
                const taskResponse = await client.tasks.getTask(taskUid)
                if (!taskResponse || typeof taskResponse.status === 'undefined') {
                    throw new Error('Invalid task response received')
                }
                if (taskResponse.status === 'succeeded') {
                    toast.add({
                        severity: 'success',
                        summary: 'Task Succeeded',
                        detail: successMessage,
                        life: 5000,
                    })
                    return taskResponse
                }
                if (taskResponse.status === 'failed') {
                    console.error('Task Failed', taskResponse.error?.message)
                    throw new Error(taskResponse.error?.message ? `Task Failed: ${taskResponse.error.message}` : 'Task failed.')
                }
                if (taskResponse.status === 'canceled') {
                    throw new Error(taskResponse.error?.message ? `Task Cancelled: ${taskResponse.error.message}` : 'Task cancelled.')
                }
                if (taskResponse.status === 'enqueued' || taskResponse.status === 'processing') {
                    attempts++
                    await new Promise(resolve => setTimeout(resolve, delayMs))
                    continue
                }
                throw new Error(`Unknown task status: ${taskResponse.status}`)
            }
            throw new Error(`Task did not complete after ${maxAttempts} attempts, please check the Tasks log`)
        } finally {
            checkingTaskStatus.value = false
            // Add slight delay as not to clash with potential error toasts
            setTimeout(() => {
                toast.remove(taskToastOptions)
            }, 100)
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Task Error',
                detail: newError,
                life: 7500,
            })
        }
    })

    return {
        error,
        tasksResults,
        tasks,
        isFetching,
        hasMore,
        checkingTaskStatus,
        fetchTasks,
        fetchAndAppendTasks,
        pollTaskStatus,
    }
}
