<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RecordAny } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import ThemedJsonEditor from '../ThemedJsonEditor.vue'
import { useDocuments } from '@/composables/meilisearch/useDocuments'

const props = withDefaults(defineProps<{
    indexUid: string,
    document?: RecordAny | null,
    primaryKey?: string,
}>(), {
    document: null,
})

const emit = defineEmits(['hide', 'document-updated'])

const drawerOpen = defineModel<boolean>({ default: false })

const { addOrUpdateDocuments, isSendingTask } = useDocuments()

const updatedDocument = ref<RecordAny>(props.document ?? {})
function handleSaveDocument() {
    // TODO: handle JSON errors (reference settings)
    addOrUpdateDocuments('update', props.indexUid, [updatedDocument.value], props.primaryKey)
        .then(() => {
            drawerOpen.value = false
            emit('document-updated')
        })
}

watch(() => props.document, (newVal: RecordAny | null) => {
    if (newVal) {
        updatedDocument.value = newVal
    }
})
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
