import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';

export function useStats() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const checkingTaskStatus = ref(false);
    const error = ref<string | null>(null);

    async function waitForTask(taskUid: number, maxAttempts = 30, delayMs = 250) {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        checkingTaskStatus.value = true;
        let attempts = 0;
        try {
            while (attempts < maxAttempts) {
                const taskResponse = await client.tasks.getTask(taskUid);
                if (!taskResponse || typeof taskResponse.status === 'undefined') {
                    throw new Error('Invalid task response received');
                }
                if (taskResponse.status === 'succeeded') {
                    return taskResponse;
                }
                if (taskResponse.status === 'failed') {
                    throw new Error(taskResponse.error?.message || 'Task failed');
                }
                if (taskResponse.status === 'canceled') {
                    throw new Error('Task was canceled');
                }
                if (taskResponse.status === 'enqueued' || taskResponse.status === 'processing') {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
                throw new Error(`Unknown task status: ${taskResponse.status}`);
            }
            throw new Error(`Task did not complete after ${maxAttempts} attempts`);
        } finally {
            checkingTaskStatus.value = false;
        }
    }

    return {
        error,
        waitForTask
    };
}