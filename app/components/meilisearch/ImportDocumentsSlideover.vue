<script setup lang="ts">
import type { ContentType, RecordAny, Task } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import ThemedJsonEditor from '../ThemedJsonEditor.vue'
import { useDocuments } from '@/composables/meilisearch/useDocuments'

const props = defineProps<{
    indexUid: string,
    primaryKey?: string,
}>()

const emit = defineEmits(['documents-imported'])

const open = defineModel<boolean>('open', { default: false })

const { addOrUpdateDocuments, addOrUpdateDocumentsFromFile, isSendingTask, error } = useDocuments()

const newDocuments = ref<RecordAny[]>([])
const newDocumentsFile = ref<File | null>(null)
const fileError = ref('')

const importMethod = ref<'upload' | 'manual'>('upload')
const importMode = ref<'addition' | 'update'>('addition')
const importModeOptions = [
    { label: 'Add or replace', value: 'addition' },
    { label: 'Add or update', value: 'update' },
]
const uploadContentType = ref<ContentType>('application/json')
const uploadOptions = [
    { label: 'CSV', value: 'text/csv' },
    { label: 'JSON', value: 'application/json' },
    //{ label: 'x-ndjson', value: 'application/x-ndjson' },
]
const importMethodOptions = [
    { label: 'Upload', value: 'upload', icon: 'i-lucide-upload' },
    { label: 'Manual', value: 'manual', icon: 'i-lucide-braces' },
]

const jsonError = ref('')
const btnDisabled = computed(() => {
    if (importMethod.value === 'manual' && jsonError.value) {
        return true
    }
    if (importMethod.value === 'upload') {
        return newDocumentsFile.value === null || Boolean(fileError.value)
    } else if (importMethod.value === 'manual') {
        return newDocuments.value?.length === 0
    }
    return true
})

async function handleSaveDocument() {
    try {
        let task: Task | undefined
        if (importMethod.value === 'manual') {
            // TODO: handle JSON errors (reference settings)
            task = await addOrUpdateDocuments(importMode.value, props.indexUid, newDocuments.value, props.primaryKey)
        } else {
            if (!newDocumentsFile.value) {
                return
            }

            task = await addOrUpdateDocumentsFromFile(importMode.value, props.indexUid, newDocumentsFile.value, uploadContentType.value)
        }

        if (task?.status !== 'succeeded') return
        open.value = false
        emit('documents-imported')
    } catch {
        // useDocuments already exposes import failures through error state and toast.
    }
}

function reset() {
    importMethod.value = 'upload'
    importMode.value = 'addition'
    uploadContentType.value = 'application/json'
    newDocuments.value = []
    newDocumentsFile.value = null
    fileError.value = ''
    jsonError.value = ''
}

watch(open, (isVisible) => {
    if (!isVisible) {
        reset()
    }
})

watch(() => newDocuments.value, (newVal) => {
    if (importMethod.value === 'manual') {
        const invalidJsonMessage = 'Please correct the invalid documents JSON.'
        jsonError.value = (newVal === undefined) ? invalidJsonMessage : ''
    }
})

watch(uploadContentType, () => {
    newDocumentsFile.value = null
    fileError.value = ''
})

watch(newDocumentsFile, (file) => {
    fileError.value = file && file.size > 100_000_000
        ? 'The selected file exceeds the 100 MB upload limit.'
        : ''
})
</script>

<template>
    <USlideover
        v-model:open="open"
        title="Import Documents"
        :ui="{ content: 'sm:max-w-4xl' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <UFormField label="Import mode">
                    <USelect
                        v-model="importMode"
                        :items="importModeOptions"
                        class="w-full sm:w-48"
                    />
                </UFormField>
                <UAlert
                    variant="subtle"
                    color="info"
                    icon="i-lucide-info"
                    title="Import behavior"
                >
                    <template #description>
                        Reference the Meilisearch docs for the difference between <AppExternalLink
                            class="p-0 align-baseline"
                            href="https://www.meilisearch.com/docs/reference/api/documents/add-or-replace-documents"
                        >
                            add or replace</AppExternalLink> vs. <AppExternalLink
                            class="p-0 align-baseline"
                            href="https://www.meilisearch.com/docs/reference/api/documents/add-or-update-documents"
                        >add or update</AppExternalLink> functionality.
                    </template>
                </UAlert>
                <UAlert
                    v-if="error"
                    variant="subtle"
                    color="error"
                    icon="i-lucide-circle-alert"
                    title="Error importing documents"
                    :description="error"
                />
                <div>
                    <UTabs
                        v-model="importMethod"
                        :items="importMethodOptions"
                        :content="false"
                    />
                    <div class="pt-4">
                        <div v-if="importMethod === 'upload'">
                            <div class="flex flex-col gap-4">
                                <UAlert
                                    v-if="uploadContentType === 'text/csv'"
                                    variant="subtle"
                                    color="warning"
                                    icon="i-lucide-triangle-alert"
                                    title="CSV structure limitations"
                                    description="CSV uploads may not handle arrays and nested objects correctly. Use this option for basic key/value datasets."
                                />
                                <UFormField label="File format">
                                    <USelect
                                        v-model="uploadContentType"
                                        :items="uploadOptions"
                                        class="w-full sm:w-40"
                                    />
                                </UFormField>
                                <UFileUpload
                                    v-model="newDocumentsFile"
                                    :accept="uploadContentType"
                                    label="Choose file"
                                    description="JSON or CSV, up to 100 MB"
                                    layout="list"
                                    class="min-h-32"
                                />
                                <UAlert
                                    v-if="fileError"
                                    variant="subtle"
                                    color="error"
                                    icon="i-lucide-circle-alert"
                                    :description="fileError"
                                />
                            </div>
                        </div>
                        <div v-else>
                            <div class="flex flex-col gap-4">
                                <UAlert
                                    v-if="jsonError"
                                    variant="subtle"
                                    color="error"
                                    icon="i-lucide-circle-alert"
                                    :description="jsonError"
                                />
                                <ThemedJsonEditor
                                    v-model="newDocuments"
                                    :mode="Mode.text"
                                    :main-menu-bar="false"
                                    :stringified="false"
                                />
                            </div>
                        </div>
                    </div>
                </div>
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
                    label="Submit"
                    :loading="isSendingTask"
                    :disabled="btnDisabled"
                    @click="handleSaveDocument"
                />
            </div>
        </template>
    </USlideover>
</template>
