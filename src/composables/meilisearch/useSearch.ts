import { ref, watch } from 'vue';
import { type SearchParams, type SearchResponse } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';

export function useSearch() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const searchResults = ref<SearchResponse | null>(null);
    const searchParams = ref<SearchParams>();
    const isFetching = ref(false);
    const error = ref<string | null>(null);

    async function search(indexUid: string, query?: string, params?: SearchParams) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
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
        isFetching,
        error,
        search,
    };
}