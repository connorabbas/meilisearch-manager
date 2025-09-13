<script setup lang="ts">
import { ref } from 'vue';
import type { RecordAny } from 'meilisearch';
import { Mode } from 'vanilla-jsoneditor';
import ThemedJsonEditor from '../ThemedJsonEditor.vue';
import { useDocuments } from '@/composables/meilisearch/useDocuments';

const props = defineProps<{
    indexUid: string,
    document: RecordAny,
    primaryKey?: string,
}>();

const emit = defineEmits(['hide', 'document-updated']);

const drawerOpen = defineModel<boolean>({ default: false });

const { updateDocuments, isSendingTask } = useDocuments();

const updatedDocument = ref<RecordAny>(props.document);
function handleSaveDocument() {
    // TODO: handle JSON errors (reference settings)
    // TODO: if drawer is closed manually right after saving, the emit won't send... resulting in no refresh in the parent/list view
    updateDocuments(props.indexUid, [updatedDocument.value], props.primaryKey)
        .then(() => {
            drawerOpen.value = false;
            emit('document-updated');
        });
}
</script>

<template>
    <Drawer
        v-model:visible="drawerOpen"
        header="Edit Document"
        class="w-full sm:w-[60rem]"
        position="right"
        blockScroll
        @hide="$emit('hide')"
    >
        <div>
            <ThemedJsonEditor
                v-model="updatedDocument"
                :mode="Mode.text"
                :main-menu-bar="false"
                :stringified="false"
            />
        </div>
        <template #footer>
            <Button
                label="Save"
                :loading="isSendingTask"
                @click="handleSaveDocument"
            />
        </template>
    </Drawer>
</template>