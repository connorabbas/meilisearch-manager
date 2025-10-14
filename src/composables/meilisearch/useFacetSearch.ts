import { ref, watch } from 'vue'
import { SearchForFacetValuesParams, SearchForFacetValuesResponse } from 'meilisearch'
import { useToast } from 'primevue/usetoast'
import { useMeilisearchStore } from '@/stores/meilisearch'

export function useFacetSearch() {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()

    const facetResults = ref<SearchForFacetValuesResponse | null>(null)

    const isFetching = ref(false)
    const error = ref<string | null>(null)

    async function searchFacetValues(
        indexUid: string,
        params: SearchForFacetValuesParams
    ): Promise<SearchForFacetValuesResponse | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'MeiliSearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.index(indexUid).searchForFacetValues(params)
            facetResults.value = results
            return results
        } catch (err) {
            facetResults.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Facet Search Error',
                detail: newError,
                life: 7500,
            })
        }
    })

    return {
        facetResults,
        isFetching,
        error,
        searchFacetValues
    }
}
