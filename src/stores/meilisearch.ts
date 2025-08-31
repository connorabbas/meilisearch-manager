// stores/meilisearch.ts
import { defineStore } from 'pinia';
import { ref, shallowRef, computed, readonly } from 'vue';
import { MeiliSearch, type Stats } from 'meilisearch';
import { useToast } from 'primevue/usetoast';

export const useMeilisearchStore = defineStore('meilisearch', () => {
    const toast = useToast();

    // State
    const client = shallowRef<MeiliSearch | null>(null);
    const serverStats = ref<Stats | null>(null);
    const isConnecting = ref(false);
    const isLoadingStats = ref(false);
    const connectionError = ref<string | null>(null);

    // Computed
    const isConnected = computed(() => client.value !== null && !connectionError.value);

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

    // Computed to get the raw client (not readonly)
    const rawClient = computed(() => client.value);

    return {
        // State
        client: readonly(client),
        rawClient, // for composables/stores to use
        serverStats: readonly(serverStats),
        
        // Loading states
        isConnecting: readonly(isConnecting),
        isLoadingStats: readonly(isLoadingStats),
        
        // Error states
        connectionError: readonly(connectionError),
        
        // Computed
        isConnected,
        
        // Actions
        connect,
        fetchStats,
    };
});