import { ref, watch, computed } from 'vue';
import { type EnqueuedTask, type Index, type IndexesQuery, type IndexesResults, type Task } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useTasks } from './useTasks';

export function useIndexes() {
    const toast = useToast();
    const confirm = useConfirm();
    const meilisearchStore = useMeilisearchStore();
    const { pollTaskStatus } = useTasks();

    const indexesResults = ref<IndexesResults<Index[]> | null>(null);
    const indexes = ref<Index[]>([]);
    const currentIndex = ref<Index | null>(null);
    const isFetching = ref(false);
    const isSendingTask = ref(false);
    const isPollingTask = ref(false);
    const error = ref<string | null>(null);

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value);

    async function fetchIndexes(params?: IndexesQuery) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        error.value = null;

        try {
            indexesResults.value = await client.getIndexes(params);
            indexes.value = indexesResults.value.results;
        } catch (err) {
            indexesResults.value = null;
            indexes.value = [];
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    async function fetchAllIndexes() {
        await fetchIndexes({
            limit: 1 // Load in just one, so we can get the total amount for the actual dataset
        });
        await fetchIndexes({
            limit: indexesResults.value?.total // Hacky way to load all the indexes
        });
    }

    async function fetchIndex(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isFetching.value = true;
        error.value = null;

        try {
            currentIndex.value = await client.getIndex(uid);
        } catch (err) {
            currentIndex.value = null;
            error.value = (err as Error).message;
        } finally {
            isFetching.value = false;
        }
    }

    async function createIndex(
        uid: string,
        primaryKey?: string,
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
            const enqueuedTask = await client.createIndex(uid, { primaryKey });
            isSendingTask.value = false;
            onTaskEnqueued?.(enqueuedTask);

            isPollingTask.value = true;
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A create task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The new index: "${uid}" was successfully created`,
            );

            return result;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isSendingTask.value = false;
            isPollingTask.value = false;
        }
    }

    async function updateIndex(
        uid: string,
        primaryKey: string,
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
            const enqueuedTask = await client.updateIndex(uid, { primaryKey });
            isSendingTask.value = false;
            onTaskEnqueued?.(enqueuedTask);

            isPollingTask.value = true;
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `An update task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The index primary key for index: "${uid}" was successfully updated to "${primaryKey}"`,
            );

            return result;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isSendingTask.value = false;
            isPollingTask.value = false;
        }
    }

    async function deleteIndex(uid: string, onTaskEnqueued?: (task: EnqueuedTask) => void): Promise<Task | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isSendingTask.value = true;
        error.value = null;

        try {
            const enqueuedTask = await client.deleteIndex(uid);
            isSendingTask.value = false;
            onTaskEnqueued?.(enqueuedTask);

            isPollingTask.value = true;
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A delete task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `The index: "${uid}" has been successfully deleted`,
            );

            return result;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isSendingTask.value = false;
            isPollingTask.value = false;
        }
    }

    function confirmDeleteIndex(
        uid: string,
        onTaskEnqueued?: (task: EnqueuedTask) => void,
        onDeletedCallback?: () => void
    ) {
        confirm.require({
            message: 'Are you absolutely sure you want to delete this index?',
            header: 'Danger Zone',
            rejectLabel: 'Cancel',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Delete',
                severity: 'danger',
            },
            accept: async () => {
                await deleteIndex(uid, (task) => {
                    onTaskEnqueued?.(task);
                }).then(() => {
                    onDeletedCallback?.();
                });
            },
        });
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Index Data Error',
                detail: newError,
                life: 7500,
            });
        }
    });

    return {
        indexesResults,
        indexes,
        currentIndex,
        isFetching,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        fetchIndexes,
        fetchAllIndexes,
        fetchIndex,
        createIndex,
        updateIndex,
        confirmDeleteIndex,
    };
}