import { computed, reactive, ref, watch } from 'vue';
import { FilterableAttributes, SortableAttributes, type EnqueuedTask, type Settings, type Task } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useTasks } from './useTasks';

export function useSettings() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();
    const { pollTaskStatus } = useTasks();

    const settings = ref<Settings | null>(null);
    const filterableAttributes = ref<FilterableAttributes | null>(null);
    const sortableAttributes = ref<SortableAttributes | null>(null);
    const isFetching = reactive({
        allSettings: false,
        filterableAttributes: false,
        sortableAttributes: false,
    });
    const isSendingTask = ref(false);
    const isPollingTask = ref(false);
    const error = ref<string | null>(null);

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value);

    async function fetchSettings(uid: string): Promise<Settings | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.allSettings = true;
        error.value = null;

        try {
            const result = await client.index(uid).getSettings();
            settings.value = result;
            return result;
        } catch (err) {
            settings.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.allSettings = false;
        }
    }

    async function fetchFilterableAttributes(uid: string): Promise<FilterableAttributes | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.filterableAttributes = true;
        error.value = null;

        try {
            const results = await client.index(uid).getFilterableAttributes();
            filterableAttributes.value = results;
            return results;
        } catch (err) {
            settings.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.filterableAttributes = false;
        }
    }

    async function fetchSortableAttributes(uid: string): Promise<SortableAttributes | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.sortableAttributes = true;
        error.value = null;

        try {
            const results = await client.index(uid).getSortableAttributes();
            sortableAttributes.value = results;
            return results;
        } catch (err) {
            settings.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.sortableAttributes = false;
        }
    }

    async function updateSettings(
        uid: string,
        settings: Settings,
        onTaskEnqueued?: (task: EnqueuedTask) => void
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isSendingTask.value = true;
        error.value = null;

        try {
            const enqueuedTask = await client.index(uid).updateSettings(settings);
            isSendingTask.value = false;
            onTaskEnqueued?.(enqueuedTask);

            isPollingTask.value = true;
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `An update settings task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The settings for index: "${uid}" have been successfully updated`,
            );

            return result;
        } catch (err) {
            error.value = (err as Error).message;
            throw err;
        } finally {
            isSendingTask.value = false;
            isPollingTask.value = false;
        }
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Settings Error',
                detail: newError,
                life: 7500,
            });
        }
    });

    return {
        settings,
        isFetching,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        fetchSettings,
        fetchFilterableAttributes,
        fetchSortableAttributes,
        updateSettings,
    };
}
