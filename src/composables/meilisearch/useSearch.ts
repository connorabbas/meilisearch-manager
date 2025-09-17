import { computed, ref, watch } from 'vue';
import { RecordAny, type SearchParams, type SearchResponse } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { usePagination } from '@/composables/usePagination';

export function useSearch(initialPerPage: number = 20) {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();
    const { currentPage, perPage, firstDatasetIndex, offset, handlePageEvent } = usePagination(initialPerPage);

    const searchResults = ref<SearchResponse | null>(null);
    const searchQuery = ref('');

    const isFetching = ref(false);
    const error = ref<string | null>(null);

    const searchParams = computed<SearchParams>(() => {
        return {
            limit: perPage.value,
            offset: offset.value,
        };
    });

    async function search(
        indexUid: string,
        query?: string,
        params?: SearchParams
    ): Promise<SearchResponse<RecordAny, SearchParams> | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        // TODO: cleanup, for testing
        //await new Promise(resolve => setTimeout(resolve, 1000));
        error.value = null;

        try {
            const results = await client.index(indexUid).search(query, params);
            searchResults.value = results;
            return results;
        } catch (err) {
            searchResults.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    function searchPaginated(
        indexUid: string,
        resetPagination: boolean = false
    ): Promise<SearchResponse<RecordAny, SearchParams> | undefined> {
        if (resetPagination) {
            currentPage.value = 1;
        }
        return search(indexUid, searchQuery.value, searchParams.value);
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Search Error',
                detail: newError,
                life: 7500,
            });
        }
    });

    return {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        searchResults,
        searchQuery,
        isFetching,
        error,
        searchParams,
        handlePageEvent,
        search,
        searchPaginated,
    };
}