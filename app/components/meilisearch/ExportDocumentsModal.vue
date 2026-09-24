<script setup lang="ts">
import { useExportDocuments } from '@/composables/meilisearch/useExportDocuments'

const props = defineProps<{
    indexUid: string,
}>()

const open = defineModel<boolean>('open', { default: false })

const { isExporting, error, exportDocuments } = useExportDocuments()

const exportFormat = ref<'json' | 'csv'>('json')
const customFilename = ref('')

const exportFormatOptions = [
    { label: 'JSON', value: 'json', icon: 'i-lucide-file-json' },
    { label: 'CSV', value: 'csv', icon: 'i-lucide-file-spreadsheet' },
]

async function handleExport() {
    const filename = customFilename.value.trim() || undefined
    await exportDocuments(props.indexUid, exportFormat.value, filename)
    if (!error.value) {
        open.value = false
    }
}

function reset() {
    exportFormat.value = 'json'
    customFilename.value = ''
}

watch(open, (isVisible) => {
    if (!isVisible) {
        reset()
    }
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="Export Documents"
        :ui="{ content: 'sm:max-w-lg' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <UAlert
                    v-if="error"
                    variant="subtle"
                    color="error"
                    icon="i-lucide-circle-alert"
                    title="Export error"
                    :description="error"
                />

                <UFormField label="Format">
                    <UTabs
                        v-model="exportFormat"
                        :items="exportFormatOptions"
                        :content="false"
                    />
                </UFormField>

                <UFormField
                    label="Filename (optional)"
                    hint="The extension is appended automatically."
                >
                    <UInput
                        v-model="customFilename"
                        placeholder="my-export"
                        class="w-full"
                    />
                </UFormField>

            </div>
        </template>

        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    :disabled="isExporting"
                    @click="open = false"
                />
                <UButton
                    label="Export"
                    icon="i-lucide-download"
                    :loading="isExporting"
                    :disabled="isExporting"
                    @click="handleExport"
                />
            </div>
        </template>
    </UModal>
</template>
