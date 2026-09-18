import type { Filter, HybridSearch, RecordAny, SearchParams, SearchResponse } from 'meilisearch'
import { useMeilisearchStore } from '@/stores/meilisearch'
import { usePagination } from '@/composables/usePagination'

export function useSearch(initialPerPage: number = 20) {
    const toast = useToast()
    const meilisearchStore = useMeilisearchStore()
    const {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        syncCurrentPageWithinTotal,
        handlePageEvent,
    } = usePagination(initialPerPage)

    const searchResults = ref<SearchResponse | null>(null)
    const searchQuery = ref('')
    const searchSort = ref<string[]>([])
    const searchGeoSort = ref<string | null>(null)
    const searchFilter = ref<Filter | null>(null)
    const hybridSearchEnabled = ref(false)
    const hybridSearchConfig = ref<HybridSearch | null>(null)
    const showRankingScore = ref(false)

    const searchSortValues = computed<string[]>(() => {
        const sortValues = [...searchSort.value]
        if (searchGeoSort.value) {
            sortValues.unshift(searchGeoSort.value)
        }

        return sortValues
    })

    const isFetching = ref(false)
    const error = ref<string | null>(null)

    const searchParams = computed<SearchParams>(() => {
        return {
            sort: searchSortValues.value.length > 0 ? searchSortValues.value : undefined,
            filter: searchFilter.value ?? undefined,
            hybrid: hybridSearchConfig.value ?? undefined,
            limit: perPage.value,
            offset: offset.value,
            showRankingScore: showRankingScore.value || undefined,
            showRankingScoreDetails: showRankingScore.value || undefined,
        }
    })

    async function search(
        indexUid: string,
        query?: string,
        params?: SearchParams
    ): Promise<SearchResponse<RecordAny, SearchParams> | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.index(indexUid).search(query, params)
            searchResults.value = results
            return results
        } catch (err) {
            searchResults.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function searchPaginated(
        indexUid: string,
        resetPagination: boolean = false
    ): Promise<SearchResponse<RecordAny, SearchParams> | undefined> {
        if (resetPagination) {
            currentPage.value = 1
        }

        const results = await search(indexUid, searchQuery.value, searchParams.value)
        if (!results) {
            return results
        }

        if (syncCurrentPageWithinTotal(results.estimatedTotalHits)) {
            return search(indexUid, searchQuery.value, searchParams.value)
        }

        return results
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Meilisearch Search Error',
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
        searchResults,
        searchQuery,
        searchSort,
        searchGeoSort,
        searchFilter,
        hybridSearchEnabled,
        hybridSearchConfig,
        showRankingScore,
        isFetching,
        error,
        searchParams,
        handlePageEvent,
        search,
        searchPaginated,
    }
}
