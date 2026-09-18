import { Meilisearch, type ContentType, type EnqueuedTask, type RecordAny, type Task } from 'meilisearch'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useTasks } from './useTasks'

export function useDocuments() {
    const toast = useToast()
    const { confirmAction } = useConfirmAction()
    const meilisearchStore = useMeilisearchStore()
    const { pollTaskStatus } = useTasks()

    const document = ref<RecordAny | null>(null)
    const isFetching = ref(false)
    const isLoading = ref(false)
    const isSendingTask = ref(false)
    const isPollingTask = ref(false)
    // TODO: errors reactive object with different keys
    const error = ref<string | null>(null)

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value)

    async function fetchDocument(
        indexUid: string,
        documentId: string | number
    ): Promise<RecordAny | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const result = await client.index(indexUid).getDocument(documentId)
            document.value = result
            return result
        } catch (err) {
            document.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function addOrUpdateDocuments(
        action: 'addition' | 'update',
        indexUid: string,
        documents: Partial<RecordAny>[],
        primaryKey?: string,
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

    // example data: https://github.com/meilisearch/datasets/tree/main/datasets
    async function addOrUpdateDocumentsFromString(
        action: 'addition' | 'update',
        indexUid: string,
        documents: string,
        contentType: ContentType,
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

    async function addOrUpdateDocumentsFromFile(
        action: 'addition' | 'update',
        indexUid: string,
        documents: File,
        contentType: ContentType,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const currentInstance = meilisearchStore.currentInstance
        if (!currentInstance || !meilisearchStore.getClient()) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isSendingTask.value = true
        error.value = null

        try {
            const uploadClient = new Meilisearch({
                host: currentInstance.host,
                apiKey: currentInstance.apiKey,
                httpClient: async (url, init) => {
                    const response = await fetch(url, {
                        ...init,
                        body: documents,
                    })
                    const responseBody = await response.text()

                    let parsedResponse: unknown
                    try {
                        parsedResponse = responseBody ? JSON.parse(responseBody) : undefined
                    } catch {
                        if (!response.ok) {
                            throw new Error(responseBody || response.statusText)
                        }
                        throw new Error('Meilisearch returned an invalid JSON response')
                    }

                    if (!response.ok) {
                        const message = parsedResponse && typeof parsedResponse === 'object' && 'message' in parsedResponse
                            ? String(parsedResponse.message)
                            : response.statusText
                        throw new Error(message)
                    }

                    return parsedResponse
                },
            })

            const index = uploadClient.index(indexUid)
            const enqueuedTask = (action === 'addition')
                ? await index.addDocumentsFromString('', contentType)
                : await index.updateDocumentsFromString('', contentType)

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
            error.value = 'Meilisearch client not connected'
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
        void confirmAction({
            title: 'Danger Zone',
            description: `Are you absolutely sure you want to delete the document: "${documentId}"?`,
            confirmLabel: 'Delete',
        }, async () => {
            await deleteDocument(indexUid, documentId).then(() => {
                onDeletedCallback?.()
            })
        })
    }

    async function deleteAllDocuments(
        indexUid: string,
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
        void confirmAction({
            title: 'Danger Zone',
            description: 'Are you absolutely sure you want to delete all the documents in this index?',
            confirmLabel: 'Delete',
        }, async () => {
            await deleteAllDocuments(indexUid).then(() => {
                onDeletedCallback?.()
            })
        })
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Meilisearch Documents Error',
                description: newError,
                duration: 7500,
            })
        }
    })

    return {
        document,
        isFetching,
        isLoading,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        fetchDocument,
        addOrUpdateDocuments,
        addOrUpdateDocumentsFromString,
        addOrUpdateDocumentsFromFile,
        confirmDeleteAllDocuments,
        confirmDeleteDocument,
    }
}
