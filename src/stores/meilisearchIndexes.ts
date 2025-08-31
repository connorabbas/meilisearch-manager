// stores/meilisearchIndexes.ts
import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { type Index, type IndexesQuery } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';

export const useMeilisearchIndexesStore = defineStore('meilisearchIndexes', () => {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    // State
    const indexes = ref<Index[]>([]);
    const currentIndex = ref<Index | null>(null);

    const isLoadingIndexes = ref(false);
    const isLoadingCurrentIndex = ref(false);

    const indexesError = ref<string | null>(null);
    const currentIndexError = ref<string | null>(null);

    // Computed
    const hasIndexes = computed(() => indexes.value.length > 0);
    const isLoading = computed(() => isLoadingIndexes.value || isLoadingCurrentIndex.value);

    // Fetch indexes
    async function fetchIndexes(params?: IndexesQuery) {
        const client = meilisearchStore.getClient();
        if (!client) return;

        isLoadingIndexes.value = true;
        indexesError.value = null;

        try {
            console.log('Fetching indexes with client:', client.constructor.name);
            const result = await client.getIndexes(params);
            indexes.value = result.results;
        } catch (err) {
            console.error('Error fetching indexes:', err);
            indexes.value = [];
            indexesError.value = (err as Error).message;
            toast.add({
                severity: 'error',
                summary: 'Indexes Error',
                detail: indexesError.value,
                life: 5000,
            });
        } finally {
            isLoadingIndexes.value = false;
        }
    }

    // Fetch one index
    async function fetchCurrentIndex(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) return;

        isLoadingCurrentIndex.value = true;
        currentIndexError.value = null;

        try {
            console.log('Fetching index:', uid, 'with client:', client.constructor.name);
            currentIndex.value = await client.getIndex(uid);
        } catch (err) {
            console.error('Error fetching current index:', err);
            currentIndex.value = null;
            currentIndexError.value = (err as Error).message;
            toast.add({
                severity: 'error',
                summary: 'Index Error',
                detail: currentIndexError.value,
                life: 5000,
            });
        } finally {
            isLoadingCurrentIndex.value = false;
        }
    }

    // Create index
    async function createIndex(uid: string, primaryKey?: string) {
        const client = meilisearchStore.getClient();
        if (!client) return;

        try {
            console.log('Creating index:', uid, 'with client:', client.constructor.name);
            const index = await client.createIndex(uid, { primaryKey });
            await fetchIndexes(); // Refresh the list

            toast.add({
                severity: 'success',
                summary: 'Index Created',
                detail: `Index ${uid} created successfully`,
                life: 3000,
            });

            return index;
        } catch (err) {
            console.error('Error creating index:', err);
            toast.add({
                severity: 'error',
                summary: 'Create Index Error',
                detail: (err as Error).message,
                life: 5000,
            });
            throw err;
        }
    }

    // Delete index
    async function deleteIndex(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) return;

        try {
            console.log('Deleting index:', uid, 'with client:', client.constructor.name);
            await client.deleteIndex(uid);
            await fetchIndexes(); // Refresh the list

            // Clear current index if it was the deleted one
            if (currentIndex.value?.uid === uid) {
                currentIndex.value = null;
            }

            toast.add({
                severity: 'success',
                summary: 'Index Deleted',
                detail: `Index ${uid} deleted successfully`,
                life: 3000,
            });
        } catch (err) {
            console.error('Error deleting index:', err);
            toast.add({
                severity: 'error',
                summary: 'Delete Index Error',
                detail: (err as Error).message,
                life: 5000,
            });
            throw err;
        }
    }

    // Utility: Clear current index
    function clearCurrentIndex() {
        currentIndex.value = null;
        currentIndexError.value = null;
    }

    // Utility: Clear all indexes
    function clearIndexes() {
        indexes.value = [];
        indexesError.value = null;
    }

    // Utility: Reset all state
    function reset() {
        clearIndexes();
        clearCurrentIndex();
    }

    return {
        // State
        indexes: readonly(indexes),
        currentIndex: readonly(currentIndex),

        // Loading states
        isLoadingIndexes: readonly(isLoadingIndexes),
        isLoadingCurrentIndex: readonly(isLoadingCurrentIndex),
        isLoading,

        // Error states
        indexesError: readonly(indexesError),
        currentIndexError: readonly(currentIndexError),

        // Computed
        hasIndexes,

        // Actions
        fetchIndexes,
        fetchCurrentIndex,
        createIndex,
        deleteIndex,

        // Utility actions
        clearCurrentIndex,
        clearIndexes,
        reset,
    };
});