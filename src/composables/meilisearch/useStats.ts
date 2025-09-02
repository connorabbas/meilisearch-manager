import { ref, readonly, watch } from 'vue';
import { type IndexStats, type Stats, type Version } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';

export function useStats() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const instanceStats = ref<Stats | null>(null);
    const indexStats = ref<IndexStats | null>(null);
    const version = ref<Version | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchStats() {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            instanceStats.value = await client.getStats();
        } catch (err) {
            instanceStats.value = null;
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchIndexStats(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            indexStats.value = await client.index(uid).getStats();
        } catch (err) {
            indexStats.value = null;
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchVersion() {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            version.value = await client.getVersion();
            return version.value;
        } catch (err) {
            version.value = null;
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    watch(() => error.value, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Stats Error',
                detail: newError,
                life: 5000,
            });
        }
    });

    return {
        instanceStats,
        indexStats,
        version,
        isLoading,
        error,
        fetchStats,
        fetchIndexStats,
        fetchVersion,
    };
}