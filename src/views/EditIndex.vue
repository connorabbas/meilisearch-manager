<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useMeilisearchIndexesStore } from '@/stores/meilisearchIndexes';
import Button from 'primevue/button';
import Card from 'primevue/card';
import ConfirmDialog from 'primevue/confirmdialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useConfirm, useToast } from 'primevue';
import InputErrors from '@/components/InputErrors.vue';
import type { MeiliSearch } from 'meilisearch';
import { useRouter } from 'vue-router';
import { AlertCircle, LoaderCircle } from 'lucide-vue-next';

const props = defineProps<{
    indexUID: string
}>();

const toast = useToast();
const confirm = useConfirm();
const router = useRouter();

const meilisearchStore = useMeilisearchStore();
const meilisearchIndexesStore = useMeilisearchIndexesStore();
const { currentIndex } = storeToRefs(meilisearchIndexesStore);

// Helper function to wait for a task to complete
// TODO: abstract to composable
const checkingTaskStatus = ref(false);
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

const primaryKey = ref(currentIndex.value?.primaryKey);
const updating = ref(false);
const updatingError = ref('');
const inputErrors = computed(() => updatingError.value ? [updatingError.value] : []);
async function updatePrimaryKey() {
    const client = meilisearchStore.getClient();
    if (!client) return;

    if (primaryKey.value) {
        updatingError.value = '';
        updating.value = true;
        try {
            // TODO: replace with Task enqueued toast, show task id
            const updateResponse = await client.updateIndex(props.indexUID, { primaryKey: primaryKey.value });
            await waitForTask(client, updateResponse.taskUid);
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

function confirmDeleteIndex() {
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
            severity: 'danger'
        },
        accept: async () => await deleteIndex(),
    });
}

const deleting = ref(false);
async function deleteIndex() {
    const client = meilisearchStore.getClient();
    if (!client) return;

    try {
        /* toast.add({
            severity: 'secondary',
            summary: 'Loading',
            detail: 'Index is being deleted',
            group: 'loading',
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        toast.remove({
            group: 'loading',
        }); */
        await client.deleteIndex(props.indexUID);
        router.push({ name: 'indexes' }).then(() => {
            toast.add({
                severity: 'info',
                summary: 'Task Dispatched',
                detail: `The task to delete the index: ${props.indexUID} has been successfully dispatched`,
                life: 7500,
            });
        });
        meilisearchIndexesStore.clearCurrentIndex();
    } catch (err) {
        console.error('Error deleting index:', err);
        toast.add({
            severity: 'error',
            summary: 'Delete Index Error',
            detail: (err as Error).message,
            life: 5000,
        });
    }
}

async function deleteIndexDocuments() {
    // TODO
}
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8 md:max-w-2xl">
        <!-- TODO: loading toast -->
        <!-- <Toast
            position="top-right"
            group="loading"
        >
            <template #messageicon>
                <LoaderCircle class="animate-spin" />
            </template>
        </Toast> -->
        <ConfirmDialog
            :draggable="false"
            blockScroll
            :pt:pcAcceptButton:loading="deleting"
        >
            <template #icon>
                <AlertCircle class="size-5!" />
            </template>
        </ConfirmDialog>
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
                                @click="confirmDeleteIndex"
                            />
                            <!-- TODO -->
                            <!-- <Button
                                label="Delete all documents"
                                severity="danger"
                            /> -->
                        </div>
                    </div>
                </Message>
            </template>
        </Card>
    </div>
</template>