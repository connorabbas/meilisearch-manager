import type { RuntimeTogglableFeatures } from 'meilisearch'
import { useMeilisearchStore } from '@/stores/meilisearch'

export function useExperimentalFeatures() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const features = ref<RuntimeTogglableFeatures | null>(null)
    const isFetching = ref(false)
    const isSubmitting = ref(false)
    const error = ref<string | null>(null)

    async function fetchExperimentalFeatures(): Promise<RuntimeTogglableFeatures | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const result = await client.getExperimentalFeatures()
            features.value = result
            return result
        } catch (err) {
            features.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function updateExperimentalFeatures(
        newFeatures: RuntimeTogglableFeatures
    ): Promise<RuntimeTogglableFeatures | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isSubmitting.value = true
        error.value = null

        try {
            const result = await client.updateExperimentalFeatures(newFeatures)
            features.value = result
            toast.add({
                color: 'success',
                icon: 'i-lucide-circle-check',
                title: 'Features Saved',
                description: 'The experimental features have been successfully updated',
                duration: 5000,
            })
            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isSubmitting.value = false
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Meilisearch Experimental Features Error',
                description: newError,
                duration: 7500,
            })
        }
    })

    return {
        features,
        isFetching,
        isSubmitting,
        error,
        fetchExperimentalFeatures,
        updateExperimentalFeatures,
    }
}
