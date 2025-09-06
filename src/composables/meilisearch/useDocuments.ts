import { computed, ref, watch } from 'vue';
import { type EnqueuedTask, type Task } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useConfirm } from 'primevue';
import { useTasks } from './useTasks';

export function useDocuments() {
    const toast = useToast();
    const confirm = useConfirm();
    const meilisearchStore = useMeilisearchStore();
    const { pollTaskStatus } = useTasks();

    const isFetching = ref(false);
    const isLoading = ref(false);
    const isSendingTask = ref(false);
    const isPollingTask = ref(false);
    const error = ref<string | null>(null);

    const isLoadingTask = computed(() => isSendingTask.value || isPollingTask.value);

    async function deleteAllDocuments(
        uid: string,
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
            const enqueuedTask = await client.index(uid).deleteAllDocuments();
            isSendingTask.value = false;
            onTaskEnqueued?.(enqueuedTask);

            isPollingTask.value = true;
            const result = await pollTaskStatus(
                enqueuedTask.taskUid,
                `A delete task for index: "${uid}" has been enqueued (taskUid: ${enqueuedTask.taskUid})`,
                `All documents from index: "${uid}" have been successfully deleted`,
            );

            return result;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isSendingTask.value = false;
            isPollingTask.value = false;
        }
    }

    function confirmDeleteAllDocuments(
        id: string,
        onDeletedCallback?: () => void
    ) {
        confirm.require({
            group: 'delete',
            message: 'Are you absolutely sure you want to delete all the documents in this index?',
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
                await deleteAllDocuments(id).then(() => {
                    onDeletedCallback?.();
                });
            },
        });
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Documents Error',
                detail: newError,
                life: 7500,
            });
        }
    });

    return {
        isFetching,
        isLoading,
        isSendingTask,
        isPollingTask,
        isLoadingTask,
        error,
        confirmDeleteAllDocuments,
    };
}