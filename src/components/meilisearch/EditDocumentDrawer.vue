<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RecordAny } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import ThemedJsonEditor from '../ThemedJsonEditor.vue'
import { useDocuments } from '@/composables/meilisearch/useDocuments'
import { AlertCircle } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
    indexUid: string,
    document?: RecordAny | null,
    primaryKey?: string,
}>(), {
    document: null,
})

const emit = defineEmits(['hide', 'document-updated'])

const drawerOpen = defineModel<boolean>({ default: false })

const { addOrUpdateDocuments, isSendingTask, error } = useDocuments()

const updatedDocument = ref<RecordAny>(props.document ?? {})
function handleSaveDocument() {
    addOrUpdateDocuments('update', props.indexUid, [updatedDocument.value], props.primaryKey)
        .then(() => {
            drawerOpen.value = false
            emit('document-updated')
        })
}

const jsonError = ref('')
const hasErrors = computed(() => Boolean(error.value || jsonError.value))

watch(() => updatedDocument.value, (newVal) => {
    const invalidJsonMessage = 'Please correct the invalid document JSON.'
    jsonError.value = (newVal === undefined) ? invalidJsonMessage : ''
})

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
        <div class="flex flex-col gap-4 mt-1">
            <div v-if="hasErrors">
                <Message severity="error">
                    <template #icon>
                        <AlertCircle />
                    </template>
                    <div v-if="jsonError">
                        {{ jsonError }}
                    </div>
                    <div v-if="error">
                        {{ error }}
                    </div>
                </Message>
            </div>
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
                :disabled="hasErrors"
                @click="handleSaveDocument"
            />
        </template>
    </Drawer>
</template>
