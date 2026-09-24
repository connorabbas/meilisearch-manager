<script setup lang="ts">
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

const emit = defineEmits(['document-updated'])


const open = defineModel<boolean>('open', { default: false })

const { addOrUpdateDocuments, isSendingTask, error } = useDocuments()

const updatedDocument = ref<RecordAny>(props.document ?? {})
function handleSaveDocument() {
    addOrUpdateDocuments('update', props.indexUid, [updatedDocument.value], props.primaryKey)
        .then(() => {
            open.value = false
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
    <USlideover
        v-model:open="open"
        title="Edit Document"
        :ui="{ content: 'sm:max-w-4xl' }"
    >
        <template #body>
            <div class="flex flex-col gap-4 mt-1">
                <UAlert
                    v-if="hasErrors"
                    variant="subtle"
                    color="error"
                    icon="i-lucide-circle-alert"
                    title="Unable to save document"
                    :description="jsonError || error || undefined"
                />
                <ThemedJsonEditor
                    v-model="updatedDocument"
                    :mode="Mode.text"
                    :main-menu-bar="false"
                    :stringified="false"
                />
            </div>
        </template>
        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    :disabled="isSendingTask"
                    @click="open = false"
                />
                <UButton
                    label="Save"
                    :loading="isSendingTask"
                    :disabled="hasErrors"
                    @click="handleSaveDocument"
                />
            </div>
        </template>
    </USlideover>
</template>
