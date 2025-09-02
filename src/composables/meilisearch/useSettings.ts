import { ref, watch } from 'vue';
import { type EnqueuedTask, type Settings } from 'meilisearch';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';

export function useSettings() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const settings = ref<Settings | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchSettings(uid: string) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            settings.value = await client.index(uid).getSettings();
        } catch (err) {
            settings.value = null;
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateSettings(uid: string, settings: Settings): Promise<EnqueuedTask | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            const response = await client.index(uid).updateSettings(settings);
            toast.add({
                severity: 'info',
                summary: 'Task Enqueued',
                detail: `The update settings task for index: "${uid}" has been successfully enqueued (taskUid: ${response.taskUid})`,
                life: 7500,
            });
            return response;
        } catch (err) {
            error.value = (err as Error).message;
        } finally {
            isLoading.value = false;
        }
    }

    watch(() => error.value, (newError) => {
        if (newError) {
            toast.add({
                severity: 'error',
                summary: 'Meilisearch Settings Error',
                detail: newError,
                life: 5000,
            });
        }
    });

    return {
        settings,
        isLoading,
        error,
        fetchSettings,
        updateSettings,
    };
}