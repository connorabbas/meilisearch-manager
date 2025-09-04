import { computed, ref, watch } from 'vue';
import { type EnqueuedTask, type Key, type KeysQuery, type KeysResults, type Settings, type Task } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useTasks } from './useTasks';

export function useKeys() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();
    //const { pollTaskStatus } = useTasks();

    const keysResults = ref<KeysResults | null>(null);
    const keys = ref<Key[] | null>(null);
    const isFetching = ref(false);
    const isSendingTask = ref(false);
    const isPollingTask = ref(false);
    const error = ref<string | null>(null);

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value);

    async function fetchKeys(params?: KeysQuery) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        error.value = null;

        try {
            keysResults.value = await client.getKeys(params);
            keys.value = keysResults.value.results;
        } catch (err) {
            keysResults.value = null;
            keys.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    async function fetchAllKeys() {
        await fetchKeys({
            limit: 1 // Load in just one, so we can get the total amount for the actual dataset
        });
        await fetchKeys({
            limit: keysResults.value?.total // Hacky way to load all the indexes
        });
    }

    watch(() => error.value, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Keys Error',
                detail: newError,
                life: 5000,
            });
        }
    });

    return {
        keys,
        keysResults,
        isFetching,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        fetchKeys,
        fetchAllKeys,
    };
}