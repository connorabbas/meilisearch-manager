import { defineStore } from 'pinia';
import { ref, shallowRef, computed, readonly } from 'vue';
import { MeiliSearch } from 'meilisearch';
import { useToast } from 'primevue/usetoast';

export const useMeilisearchStore = defineStore('meilisearch', () => {
    const toast = useToast();

    const client = shallowRef<MeiliSearch | null>(null);
    const isConnecting = ref(false);
    const connectionError = ref<string | null>(null);

    const isConnected = computed(() => client.value !== null && !connectionError.value);

    function getConnectionConfig() {
        const host = import.meta.env.VITE_MEILISEARCH_HOST;
        const apiKey = import.meta.env.VITE_MEILISEARCH_API_KEY;
        if (!host) throw new Error('VITE_MEILISEARCH_HOST is not set');
        return { host, apiKey };
    }

    async function connect() {
        if (client.value && !connectionError.value) {
            return client.value;
        }

        isConnecting.value = true;
        connectionError.value = null;

        try {
            const conn = new MeiliSearch(getConnectionConfig());

            // Verify connection with health check
            await conn.health();
            client.value = conn;

            return conn;
        } catch (err) {
            client.value = null;
            connectionError.value = (err as Error).message;
            toast.add({
                severity: 'error',
                summary: 'Connection Failed',
                detail: connectionError.value,
                life: 5000,
            });
            throw err;
        } finally {
            isConnecting.value = false;
        }
    }

    function getClient() {
        if (!client.value) {
            // TODO: try to connect with try/catch
            console.error('MeiliSearch client is not initialized');
            return null;
        }
        return client.value;
    }

    return {
        client: readonly(client),
        isConnecting: readonly(isConnecting),
        isConnected,
        connectionError: readonly(connectionError),
        connect,
        getClient,
    };
});