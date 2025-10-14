import { computed, ref, watch } from 'vue'
import { ContentType, type EnqueuedTask, type RecordAny, type Task } from 'meilisearch'
import { useToast } from 'primevue/usetoast'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useConfirm } from 'primevue'
import { useTasks } from './useTasks'

export function useDocuments() {
    const toast = useToast()
    const confirm = useConfirm()
    const meilisearchStore = useMeilisearchStore()
    const { pollTaskStatus } = useTasks()

    const isFetching = ref(false)
    const isLoading = ref(false)
    const isSendingTask = ref(false)
    const isPollingTask = ref(false)
    // TODO: errors reactive object with different keys
    const error = ref<string | null>(null)

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value)

    async function addOrUpdateDocuments(
        action: 'addition' | 'update',
        indexUid: string,
        documents: Partial<RecordAny>[],
        primaryKey?: string,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'MeiliSearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = (action === 'addition')
                ? await client.index(indexUid).addDocuments(documents, { primaryKey })
                : await client.index(indexUid).updateDocuments(documents, { primaryKey })

            const pastVerb = (action === 'addition')
                ? 'imported'
                : 'updated'

            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A ${action} task has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `Documents have been successfully ${pastVerb}`,
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

    async function addOrUpdateDocumentsFromString(
        action: 'addition' | 'update',
        indexUid: string,
        documents: string,
        contentType: ContentType,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'MeiliSearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = (action === 'addition')
                ? await client.index(indexUid).addDocumentsFromString(documents, contentType)
                : await client.index(indexUid).updateDocumentsFromString(documents, contentType)

            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A ${action} task has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                'Documents have been successfully imported',
                60,
                1000
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

    async function deleteDocument(
        indexUid: string,
        documentId: string | number,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'MeiliSearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = await client.index(indexUid).deleteDocument(documentId)
            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A delete task for document: "${documentId}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `Document: "${documentId}" has been successfully deleted`,
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

    function confirmDeleteDocument(
        indexUid: string,
        documentId: string | number,
        onDeletedCallback?: () => void
    ) {
        confirm.require({
            group: 'delete',
            message: `Are you absolutely sure you want to delete the document: "${documentId}"?`,
            header: 'Danger Zone',
            rejectLabel: 'Cancel',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Delete',
                severity: 'danger',
            },
            accept: async () => {
                await deleteDocument(indexUid, documentId).then(() => {
                    onDeletedCallback?.()
                })
            },
        })
    }

    async function deleteAllDocuments(
        indexUid: string,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'MeiliSearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const enqueuedTask = await client.index(indexUid).deleteAllDocuments()
            isSendingTask.value = false
            onTaskEnqueued?.(enqueuedTask)

            isPollingTask.value = true
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A delete task for index: "${indexUid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `All documents from index: "${indexUid}" have been successfully deleted`,
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

    function confirmDeleteAllDocuments(
        indexUid: string,
        onDeletedCallback?: () => void
    ) {
        confirm.require({
            group: 'delete',
            message: 'Are you absolutely sure you want to delete all the documents in this index?',
            header: 'Danger Zone',
            rejectLabel: 'Cancel',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Delete',
                severity: 'danger',
            },
            accept: async () => {
                await deleteAllDocuments(indexUid).then(() => {
                    onDeletedCallback?.()
                })
            },
        })
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Documents Error',
                detail: newError,
                life: 7500,
            })
        }
    })

    return {
        isFetching,
        isLoading,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        addOrUpdateDocuments,
        addOrUpdateDocumentsFromString,
        confirmDeleteAllDocuments,
        confirmDeleteDocument,
    }
}