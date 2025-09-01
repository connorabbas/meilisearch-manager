// stores/meilisearch.ts
import { defineStore } from 'pinia';
import { ref, shallowRef, computed, readonly } from 'vue';
import { MeiliSearch, type Stats, type Version } from 'meilisearch';
import { useToast } from 'primevue/usetoast';

export const useMeilisearchStore = defineStore('meilisearch', () => {
    const toast = useToast();

    // State
    const client = shallowRef<MeiliSearch | null>(null);
    const version = ref<Version | null>(null);
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
            client.value = conn;
        } catch (err) {
            client.value = null;
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

    // Helper to get client with validation
    function getClient() {
        if (!client.value) {
            console.error('MeiliSearch client is null');
            toast.add({
                severity: 'error',
                summary: 'Connection Error',
                detail: 'MeiliSearch client not connected or invalid',
                life: 5000,
            });
            return null;
        }

        return client.value;
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

    // Fetch Meilisearch version
    async function fetchVersion() {
        if (!client.value) return;
        isLoadingStats.value = true;
        try {
            version.value = await client.value.getVersion();
        } catch (err) {
            version.value = null;
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

    return {
        // State
        version: readonly(version),
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
        getClient,
        fetchStats,
        fetchVersion,
    };
});