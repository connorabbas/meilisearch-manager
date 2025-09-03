import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useMeilisearchStore } from '@/stores/meilisearch';
import type { Task } from 'meilisearch';

export function useTasks() {
    const toast = useToast();
    const meilisearchStore = useMeilisearchStore();

    const checkingTaskStatus = ref(false);
    const error = ref<string | null>(null);

    async function pollTaskStatus(
        taskUid: number,
        taskEnqueuedMessage: string,
        successMessage: string,
        maxAttempts = 30,
        delayMs = 500
    ): Promise<Task | undefined> {
        const client = meilisearchStore.getClient();
        if (!client) {
            error.value = 'MeiliSearch client not connected';
            return;
        }

        const taskToastOptions = {
            severity: 'secondary',
            summary: 'Task Enqueued',
            detail: taskEnqueuedMessage,
        };

        checkingTaskStatus.value = true;
        let attempts = 0;
        try {
            toast.add(taskToastOptions);
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait to show the task toast spin for a bit
            while (attempts < maxAttempts) {
                const taskResponse = await client.tasks.getTask(taskUid);
                if (!taskResponse || typeof taskResponse.status === 'undefined') {
                    throw new Error('Invalid task response received');
                }
                if (taskResponse.status === 'succeeded') {
                    toast.add({
                        severity: 'success',
                        summary: 'Task Succeeded',
                        detail: successMessage,
                        life: 5000,
                    });
                    return taskResponse;
                }
                if (taskResponse.status === 'failed') {
                    throw new Error(taskResponse.error?.message ? `Task Failed: ${taskResponse.error.message}` : 'Task failed.');
                }
                if (taskResponse.status === 'canceled') {
                    throw new Error(taskResponse.error?.message ? `Task Cancelled: ${taskResponse.error.message}` : 'Task cancelled.');
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
            toast.remove(taskToastOptions);
        }
    }

    return {
        error,
        pollTaskStatus
    };
}