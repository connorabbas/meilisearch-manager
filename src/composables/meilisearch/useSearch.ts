import { computed, ref, watch } from 'vue';
import { type SearchParams, type SearchResponse } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';
import type { DataTablePageEvent, PageState } from 'primevue';

export function useSearch(initialPerPage: number = 20) {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const searchResults = ref<SearchResponse | null>(null);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const perPage = ref(initialPerPage);

    const isFetching = ref(false);
    const error = ref<string | null>(null);

    const firstDatasetIndex = computed(() => {
        return (currentPage.value - 1) * perPage.value;
    });
    const searchParams = computed<SearchParams>(() => {
        return {
            limit: perPage.value,
            offset: (perPage.value * currentPage.value) - perPage.value,
        };
    });

    async function search(indexUid: string, query?: string, params?: SearchParams) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        error.value = null;

        try {
            searchResults.value = await client.index(indexUid).search(query, params);
        } catch (err) {
            searchResults.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    function statefulSearch(indexUid: string) {
        currentPage.value = 1;
        search(indexUid, searchQuery.value, searchParams.value);
    }

    function handlePageEvent(indexUid: string, event: PageState | DataTablePageEvent, scrollTop: boolean = true) {
        if (event.rows !== perPage.value) {
            currentPage.value = 1;
        } else {
            currentPage.value = event.page + 1;
        }
        perPage.value = event.rows;

        search(indexUid, searchQuery.value, searchParams.value).then(() => {
            if (scrollTop) {
                window.scrollTo({ top: 0 });
            }
        });
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
        searchResults,
        searchQuery,
        currentPage,
        perPage,
        isFetching,
        error,
        firstDatasetIndex,
        searchParams,
        search,
        statefulSearch,
        handlePageEvent,
    };
}