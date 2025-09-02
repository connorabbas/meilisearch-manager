import { ref, readonly, watch } from 'vue';
import { type EnqueuedTask, type Index, type IndexesQuery } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useRouter } from 'vue-router';

export function useIndexes() {
    const toast = useToast();
    const confirm = useConfirm();
    const router = useRouter();
    const meilisearchStore = useMeilisearchStore();

    const indexes = ref<Index[]>([]);
    const currentIndex = ref<Index | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchIndexes(params?: IndexesQuery) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const result = await client.getIndexes(params);
            indexes.value = result.results;
        } catch (err) {
            indexes.value = [];
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchIndex(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            currentIndex.value = await client.getIndex(uid);
        } catch (err) {
            currentIndex.value = null;
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function createIndex(uid: string, primaryKey?: string): Promise<EnqueuedTask | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await client.createIndex(uid, { primaryKey });
            toast.add({
                severity: 'info',
                summary: 'Task Enqueued',
                detail: `A create task for index: "${uid}" has been enqueued (taskUid: ${response.taskUid})`,
                life: 7500,
            });
            return response;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateIndex(uid: string, primaryKey: string): Promise<EnqueuedTask | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await client.updateIndex(uid, { primaryKey });
            toast.add({
                severity: 'info',
                summary: 'Task Enqueued',
                detail: `An update task for index: "${uid}" has been enqueued (taskUid: ${response.taskUid})`,
                life: 7500,
            });
            return response;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteIndex(uid: string): Promise<EnqueuedTask | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await client.deleteIndex(uid);
            currentIndex.value = null;
            router.push({ name: 'dashboard' }).then(() => {
                toast.add({
                    severity: 'info',
                    summary: 'Task Enqueued',
                    detail: `A delete task for index: "${uid}" has been enqueued (taskUid: ${response.taskUid})`,
                    life: 7500,
                });
            });
            return response;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    function confirmDeleteIndex(uid: string) {
        confirm.require({
            message: 'Are you absolutely sure you want to delete this index?',
            header: 'Danger Zone',
            icon: 'pi pi-info-circle',
            rejectLabel: 'Cancel',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Delete',
                severity: 'danger',
                loading: isLoading.value,
            },
            accept: async () => await deleteIndex(uid),
        });
    }

    watch(() => error.value, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Index Data Error',
                detail: newError,
                life: 5000,
            });
        }
    });

    return {
        indexes,
        currentIndex,
        isLoading,
        error,
        fetchIndexes,
        fetchIndex,
        createIndex,
        updateIndex,
        confirmDeleteIndex,
    };
}