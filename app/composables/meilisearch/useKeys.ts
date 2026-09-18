import type { Key, KeyCreation, KeysQuery, KeysResults, KeyUpdate } from 'meilisearch'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { usePagination } from '../usePagination'

export function useKeys() {
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
    } = usePagination()

    const keysResults = ref<KeysResults | null>(null)
    const keys = ref<Key[] | null>(null)
    const isFetching = ref(false)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const keysQuery = computed<KeysQuery>(() => {
        return {
            limit: perPage.value,
            offset: offset.value,
        }
    })

    async function fetchKeys(params?: KeysQuery): Promise<KeysResults | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.getKeys(params)
            keysResults.value = results
            keys.value = results.results
            return results
        } catch (err) {
            keysResults.value = null
            keys.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchKeysPaginated(resetPagination: boolean = false): Promise<KeysResults | undefined> {
        if (resetPagination) {
            currentPage.value = 1
        }

        const results = await fetchKeys(keysQuery.value)
        if (!results) {
            return results
        }

        if (syncCurrentPageWithinTotal(results.total)) {
            return fetchKeys(keysQuery.value)
        }

        return results
    }

    async function createKey(params: KeyCreation): Promise<Key | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            return await client.createKey(params)
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            return await client.updateKey(keyOrUid, options)
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function deleteKey(id: string): Promise<void> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            return await client.deleteKey(id)
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    function confirmDeleteKey(
        id: string,
        onDeletedCallback?: () => void
    ) {
        void confirmAction({
            title: 'Danger Zone',
            description: 'Are you absolutely sure you want to delete this key?',
            confirmLabel: 'Delete',
        }, async () => {
            await deleteKey(id).then(() => {
                onDeletedCallback?.()
            })
        })
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Meilisearch Keys Error',
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
        keys,
        keysResults,
        isFetching,
        isLoading,
        error,
        handlePageEvent,
        fetchKeys,
        fetchKeysPaginated,
        createKey,
        updateKey,
        confirmDeleteKey,
    }
}
