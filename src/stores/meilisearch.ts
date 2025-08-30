// stores/meilisearch.ts
import { defineStore } from 'pinia';
import { ref, shallowRef, computed, readonly } from 'vue';
import { MeiliSearch, type Index, type IndexesQuery, type Stats } from 'meilisearch';
import { useToast } from 'primevue/usetoast';

export const useMeilisearchStore = defineStore('meilisearch', () => {
    const toast = useToast();

    // State
    const client = shallowRef<MeiliSearch | null>(null);
    const indexes = ref<Index[]>([]);
    const currentIndex = ref<Index | null>(null);
    const serverStats = ref<Stats | null>(null);
    //const indexDocuments = ref<RecordAny[] | null>(null)

    const isConnecting = ref(false);
    const isLoadingIndexes = ref(false);
    const isLoadingCurrentIndex = ref(false);
    const isLoadingStats = ref(false);

    const connectionError = ref<string | null>(null);
    const indexesError = ref<string | null>(null);
    const currentIndexError = ref<string | null>(null);

    // Helpers
    const isConnected = computed(() => client.value !== null && !connectionError.value);
    const hasIndexes = computed(() => indexes.value.length > 0);
    const isLoading = computed(() =>
        isConnecting.value ||
        isLoadingIndexes.value ||
        isLoadingCurrentIndex.value ||
        isLoadingStats.value
    );

    // Build config from env
    function getConnectionConfig() {
        const host = import.meta.env.VITE_MEILISEARCH_HOST;
        const apiKey = import.meta.env.VITE_MEILISEARCH_API_KEY;
        if (!host) throw new Error('VITE_MEILISEARCH_HOST is not set');
        return { host, apiKey };
    }

    // Connect
    async function connect() {
        isConnecting.value = true;
        connectionError.value = null;
        try {
            const config = getConnectionConfig();
            const conn = new MeiliSearch(config);
            const stats = await conn.getStats();
            client.value = conn;
            serverStats.value = stats;
        } catch (err) {
            client.value = null;
            serverStats.value = null;
            connectionError.value = (err as Error).message;
            toast.add({
                severity: 'error',
                summary: 'Connection Failed',
                detail: connectionError.value,
                life: 5000,
            });
        } finally {
            isConnecting.value = false;
        }
    }

    // Fetch stats
    async function fetchStats() {
        if (!client.value) return;
        isLoadingStats.value = true;
        try {
            serverStats.value = await client.value.getStats();
        } catch (err) {
            serverStats.value = null;
            toast.add({
                severity: 'error',
                summary: 'Stats Error',
                detail: (err as Error).message,
                life: 5000,
            });
        } finally {
            isLoadingStats.value = false;
        }
    }

    // Fetch indexes
    async function fetchIndexes(params?: IndexesQuery) {
        if (!client.value) return;
        isLoadingIndexes.value = true;
        indexesError.value = null;
        try {
            const result = await client.value.getIndexes(params);
            indexes.value = result.results;
        } catch (err) {
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
        if (!client.value) return;
        isLoadingCurrentIndex.value = true;
        currentIndexError.value = null;
        try {
            currentIndex.value = await client.value.getIndex(uid);
        } catch (err) {
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

    // Index CRUD
    async function createIndex(uid: string, primaryKey?: string) {
        if (!client.value) return;
        const index = await client.value.createIndex(uid, { primaryKey });
        await fetchIndexes();
        toast.add({
            severity: 'success',
            summary: 'Index Created',
            detail: `Index ${uid} created`,
            life: 3000,
        });
        return index;
    }

    async function deleteIndex(uid: string) {
        if (!client.value) return;
        await client.value.deleteIndex(uid);
        await fetchIndexes();
        toast.add({
            severity: 'success',
            summary: 'Index Deleted',
            detail: `Index ${uid} deleted`,
            life: 3000,
        });
    }

    async function updateIndex(uid: string, primaryKey: string) {
        if (!client.value) return;
        const index = await client.value.updateIndex(uid, { primaryKey });
        await fetchCurrentIndex(uid);
        toast.add({
            severity: 'success',
            summary: 'Index Updated',
            detail: `Index ${uid} updated`,
            life: 3000,
        });
        return index;
    }

    return {
        // State
        client: readonly(client),
        serverStats: readonly(serverStats),
        indexes: readonly(indexes),
        currentIndex: readonly(currentIndex),

        // Loading states
        isConnecting: readonly(isConnecting),
        isLoadingIndexes: readonly(isLoadingIndexes),
        isLoadingCurrentIndex: readonly(isLoadingCurrentIndex),
        isLoadingStats: readonly(isLoadingStats),
        isLoading,

        // Error states
        connectionError,
        indexesError,
        currentIndexError,

        // Computed
        isConnected,
        hasIndexes,

        // Actions
        connect,
        fetchStats,
        fetchIndexes,
        fetchCurrentIndex,
        createIndex,
        deleteIndex,
        updateIndex,
    };
});
