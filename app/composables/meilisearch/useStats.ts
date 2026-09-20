import type { IndexStats, Stats, Version } from 'meilisearch'
import { useMeilisearchStore } from '@/stores/meilisearch'

export function useStats() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const instanceStats = ref<Stats | null>(null)
    const indexStats = ref<IndexStats | null>(null)
    const version = ref<Version | null>(null)
    const isFetching = ref(false)
    const isPolling = ref(false)
    const error = ref<string | null>(null)

    async function fetchStats(): Promise<Stats | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.getStats()
            instanceStats.value = results
            return results
        } catch (err) {
            instanceStats.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchIndexStats(uid: string): Promise<IndexStats | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.index(uid).getStats()
            indexStats.value = results
            return results
        } catch (err) {
            indexStats.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchVersion(): Promise<Version | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.getVersion()
            version.value = results
            return results
        } catch (err) {
            version.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function pollIndexStats(uid: string): Promise<IndexStats | undefined> {
        const client = meilisearchStore.getClient()
        if (!client || isFetching.value || isPolling.value) {
            return
        }

        isPolling.value = true

        try {
            const results = await client.index(uid).getStats()
            indexStats.value = results
            return results
        } catch (err) {
            console.error('Failed to poll index stats', err)
        } finally {
            isPolling.value = false
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Meilisearch Stats Error',
                description: newError,
                duration: 7500,
            })
        }
    })

    return {
        instanceStats,
        indexStats,
        version,
        isFetching,
        isPolling,
        error,
        fetchStats,
        fetchIndexStats,
        pollIndexStats,
        fetchVersion,
    }
}
