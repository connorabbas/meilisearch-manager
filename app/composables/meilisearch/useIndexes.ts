import type { RecordAny, EnqueuedTask, Index, IndexesQuery, IndexesResults, IndexOptions, IndexObject, Task } from 'meilisearch'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useTasks } from './useTasks'
import { usePagination } from '../usePagination'

export function useIndexes(initialPerPage: number = 20) {
    const toast = useToast()
    const { confirmAction } = useConfirmAction()
    const meilisearchStore = useMeilisearchStore()
    const {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        syncCurrentPageWithinTotal,
        handlePageEvent,
    } = usePagination(initialPerPage)
    const { pollTaskStatus } = useTasks()

    const indexesResults = ref<IndexesResults<IndexObject[]> | null>(null)
    const indexes = ref<IndexObject[]>([])
    const currentIndex = ref<Index | null>(null)
    const isFetching = ref(false)
    const isSendingTask = ref(false)
    const isPollingTask = ref(false)
    const error = ref<string | null>(null)

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value)
    const indexesQuery = computed<IndexesQuery>(() => {
        return {
            limit: perPage.value,
            offset: offset.value,
        }
    })

    async function fetchIndexes(params?: IndexesQuery): Promise<IndexesResults<IndexObject[]> | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.getRawIndexes(params)
            indexesResults.value = results
            indexes.value = results.results

            return results
        } catch (err) {
            indexesResults.value = null
            indexes.value = []
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchIndexesPaginated(resetPagination: boolean = false): Promise<IndexesResults<IndexObject[]> | undefined> {
        if (resetPagination) {
            currentPage.value = 1
        }

        const results = await fetchIndexes(indexesQuery.value)
        if (!results) {
            return results
        }

        if (syncCurrentPageWithinTotal(results.total)) {
            return fetchIndexes(indexesQuery.value)
        }

        return results
    }

    async function fetchAllIndexes() {
        await fetchIndexes({
            limit: 1 // Load in just one, so we can get the total amount for the actual dataset
        }).then(() => indexes.value = [])
        await fetchIndexes({
            limit: indexesResults.value?.total // Hacky way to load all the indexes
        })
    }

    async function fetchIndex(uid: string): Promise<Index<RecordAny> | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const result = await client.getIndex(uid)
            currentIndex.value = result
            return result
        } catch (err) {
            currentIndex.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function createIndex(
        uid: string,
        options?: IndexOptions,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = await client.createIndex(uid, options)
            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A create task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The new index: "${uid}" was successfully created`,
            )

            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isSendingTask.value = false
            isPollingTask.value = false
        }
    }

    async function updateIndex(
        uid: string,
        primaryKey: string,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = await client.updateIndex(uid, { primaryKey })
            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `An update task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The index primary key for index: "${uid}" was successfully updated to "${primaryKey}"`,
            )

            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isSendingTask.value = false
            isPollingTask.value = false
        }
    }

    async function deleteIndex(uid: string, onTaskEnqueued?: (task: EnqueuedTask) => void): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = await client.deleteIndex(uid)
            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A delete task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The index: "${uid}" has been successfully deleted`,
            )

            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isSendingTask.value = false
            isPollingTask.value = false
        }
    }

    function confirmDeleteIndex(
        uid: string,
        onTaskEnqueued?: (task: EnqueuedTask) => void,
        onDeletedCallback?: () => void
    ) {
        void confirmAction({
            title: 'Danger Zone',
            description: 'Are you absolutely sure you want to delete this index?',
            confirmLabel: 'Delete',
        }, async () => {
            await deleteIndex(uid, (task) => {
                onTaskEnqueued?.(task)
            }).then(() => {
                onDeletedCallback?.()
            })
        })
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Index Data Error',
                description: newError,
                duration: 7500,
            })
        }
    })

    return {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        indexesResults,
        indexes,
        currentIndex,
        isFetching,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        handlePageEvent,
        fetchIndexes,
        fetchIndexesPaginated,
        fetchAllIndexes,
        fetchIndex,
        createIndex,
        updateIndex,
        confirmDeleteIndex,
    }
}
