<script setup lang="ts">
import { ref } from 'vue';
import type { RecordAny } from 'meilisearch';
import { Info } from 'lucide-vue-next';
import { Mode } from 'vanilla-jsoneditor';
import ThemedJsonEditor from '../ThemedJsonEditor.vue';
import { useDocuments } from '@/composables/meilisearch/useDocuments';

const props = defineProps<{
    indexUid: string,
    primaryKey?: string,
}>();

const emit = defineEmits(['hide', 'document-created']);

const drawerOpen = defineModel<boolean>({ default: false });

const { addOrUpdateDocuments, isSendingTask } = useDocuments();

const newDocument = ref<RecordAny>({});
function resetDocument() {
    newDocument.value = {};
    if (props.primaryKey) {
        newDocument.value[props.primaryKey] = 'change me';
    }
}
resetDocument();

const additionMode = ref<'addition' | 'update'>('addition');
const additionModeOptions = [
    { label: 'Add or replace', value: 'addition' },
    { label: 'Add or update', value: 'update' },
];

function handleSaveDocument() {
    // TODO: handle JSON errors (reference settings)
    // TODO: if drawer is closed manually right after saving, the emit won't send... resulting in no refresh in the parent/list view
    addOrUpdateDocuments(additionMode.value, props.indexUid, [newDocument.value], props.primaryKey)
        .then(() => {
            drawerOpen.value = false;
            emit('document-created');
        });
}
function handleHidden() {
    emit('hide');
    resetDocument();
}
</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="New Document"
        class="w-full sm:w-[60rem]"
        position="right"
        blockScroll
        @hide="handleHidden"
    >
        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <label for="new-mode">Addition mode</label>
                <Select
                    id="new-mode"
                    v-model="additionMode"
                    class="w-fit"
                    :options="additionModeOptions"
                    optionLabel="label"
                    optionValue="value"
                />
            </div>
            <!-- TODO: error message -->
            <Message>
                <template #icon>
                    <Info />
                </template>
                <span class="font-bold">Note:</span> reference the Meilisearch docs for the difference between <a
                    class="text-inherit"
                    href="https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents"
                    target="_blank"
                >add or
                    replace</a> vs. <a
                    class="text-inherit"
                    href="https://www.meilisearch.com/docs/reference/api/documents#add-or-update-documents"
                    target="_blank"
                >add or
                    update</a> functionality.
            </Message>
            <ThemedJsonEditor
                v-model="newDocument"
                :mode="Mode.text"
                :main-menu-bar="false"
                :stringified="false"
            />
        </div>
        <template #footer>
            <Button
                label="Submit"
                :loading="isSendingTask"
                @click="handleSaveDocument"
            />
        </template>
    </Drawer>
</template>