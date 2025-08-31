<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useMeilisearchIndexesStore } from '@/stores/meilisearchIndexes';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import { useToast } from 'primevue';
import InputErrors from '@/components/InputErrors.vue';
import type { MeiliSearch } from 'meilisearch';

const props = defineProps<{
    indexUID: string
}>();

const toast = useToast();

const meilisearchStore = useMeilisearchStore();
const meilisearchIndexesStore = useMeilisearchIndexesStore();
const { currentIndex } = storeToRefs(meilisearchIndexesStore);

const primaryKey = ref(currentIndex.value?.primaryKey);
const updating = ref(false);
const updatingError = ref('');
const checkingTaskStatus = ref(false);
const inputErrors = computed(() => updatingError.value ? [updatingError.value] : []);

// Helper function to wait for a task to complete
async function waitForTask(client: MeiliSearch, taskUid: number, maxAttempts = 30, delayMs = 1000) {
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

async function updatePrimaryKey() {
    const client = meilisearchStore.getClient();
    if (!client) return;

    if (primaryKey.value) {
        updatingError.value = '';
        updating.value = true;
        try {
            const updateResponse = await client.updateIndex(props.indexUID, { primaryKey: primaryKey.value });

            // Wait for the task to complete
            const taskResponse = await waitForTask(client, updateResponse.taskUid);
            console.log('Task completed:', taskResponse);

            // Refresh the current index data
            await meilisearchIndexesStore.fetchCurrentIndex(props.indexUID);

            toast.add({
                severity: 'success',
                summary: 'Index Updated',
                detail: `Index ${props.indexUID} primary key was successfully updated`,
                life: 5000,
            });

        } catch (err) {
            updatingError.value = (err as Error).message;
            console.error('Error updating index:', err);
            toast.add({
                severity: 'error',
                summary: 'Update Primary Key Error',
                detail: (err as Error).message,
                life: 5000,
            });
        } finally {
            updating.value = false;
        }
    }
}

async function deleteIndex() {

}

async function deleteIndexDocuments() {

}
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8 md:max-w-2xl">
        <Card
            v-if="primaryKey"
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Primary Key
            </template>
            <template #content>
                <form
                    class="space-y-6"
                    @submit.prevent="updatePrimaryKey"
                >
                    <div class="flex flex-col gap-2">
                        <InputText
                            id="name"
                            v-model="primaryKey"
                            type="text"
                            :invalid="Boolean(updatingError)"
                            required
                            fluid
                        />
                        <InputErrors
                            v-if="Boolean(updatingError)"
                            :errors="inputErrors"
                        />
                    </div>
                    <div class="text-xs text-muted-color">
                        You can freely update the primary key of an index as long as it contains no documents. To change
                        the primary key of an index that already contains documents, you must first delete all documents
                        in that index. You may then change the primary key and index your dataset again.
                    </div>
                    <div class="flex items-center gap-3">
                        <Button
                            type="submit"
                            label="Save"
                            :disabled="!primaryKey"
                            :loading="updating || checkingTaskStatus"
                        />
                        <span
                            v-if="checkingTaskStatus"
                            class="text-sm text-muted-color"
                        >
                            Checking task status...
                        </span>
                    </div>
                </form>
            </template>
        </Card>
        <Card
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Delete
            </template>
            <template #content>
                <!-- <DeleteUserModal v-model="deleteUserModalOpen" /> -->
                <Message
                    severity="error"
                    pt:root:class="p-2"
                >
                    <div class="flex flex-col gap-4">
                        <div>
                            <div class="text-lg">
                                Warning
                            </div>
                            <div>
                                Please proceed with caution, this cannot be undone.
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <Button
                                label="Delete this index"
                                severity="danger"
                            />
                            <Button
                                label="Delete all documents"
                                severity="danger"
                            />
                        </div>
                    </div>
                </Message>
            </template>
        </Card>
    </div>
</template>