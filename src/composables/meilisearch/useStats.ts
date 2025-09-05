import { ref, watch } from 'vue';
import { type IndexStats, type Stats, type Version } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';

export function useStats() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const instanceStats = ref<Stats | null>(null);
    const indexStats = ref<IndexStats | null>(null);
    const version = ref<Version | null>(null);
    const isFetching = ref(false);
    const error = ref<string | null>(null);

    async function fetchStats() {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        error.value = null;

        try {
            instanceStats.value = await client.getStats();
        } catch (err) {
            instanceStats.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    async function fetchIndexStats(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        error.value = null;

        try {
            indexStats.value = await client.index(uid).getStats();
        } catch (err) {
            indexStats.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    async function fetchVersion() {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        error.value = null;

        try {
            version.value = await client.getVersion();
            return version.value;
        } catch (err) {
            version.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Stats Error',
                detail: newError,
                life: 7500,
            });
        }
    });

    return {
        instanceStats,
        indexStats,
        version,
        isFetching,
        error,
        fetchStats,
        fetchIndexStats,
        fetchVersion,
    };
}