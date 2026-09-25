<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useDebounceFn } from '@vueuse/core'
import type { SearchRuleAction, SearchRulePinAction, RecordAny } from 'meilisearch'
import type { SearchRuleDocumentOption } from '@/types'
import ThemedJsonViewer from '@/components/ThemedJsonViewer.vue'

const open = defineModel<boolean>('open', { default: false })
const action = defineModel<SearchRuleAction>('action', { required: true })
const emit = defineEmits<{ save: [] }>()

const store = useMeilisearchStore()
const { indexes, fetchAllIndexes } = useIndexes()
const indexUid = ref('')
const documentId = ref('')
const searchTerm = ref('')
const documentOptions = ref<SearchRuleDocumentOption[]>([])
const selectedDocument = ref<RecordAny | null>(null)
const previewError = ref<string | null>(null)
const isPreviewing = ref(false)
const position = ref<number | null>(0)
const isSearching = ref(false)
let previewRequestId = 0

const selectedIndex = computed(() => {
    return indexes.value.find(index => index.uid === indexUid.value)
})
const primaryKey = computed(() => selectedIndex.value?.primaryKey ?? 'id')
const canSave = computed(() => {
    return !!indexUid.value
        && !!documentId.value.trim()
        && position.value !== null
        && Number.isInteger(position.value)
        && position.value >= 0
})

function documentPreview(document: RecordAny): string {
    return Object.entries(document)
        .filter(([key, value]) => key !== primaryKey.value && value !== null && value !== undefined && typeof value !== 'object')
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(' · ') || 'No previewable fields'
}

function resetForm() {
    previewRequestId++
    isPreviewing.value = false
    indexUid.value = action.value.selector?.indexUid ?? ''
    documentId.value = action.value.selector?.id ?? ''
    searchTerm.value = ''
    documentOptions.value = []
    selectedDocument.value = null
    previewError.value = null
    position.value = (action.value.action as SearchRulePinAction)?.position ?? 0
}

async function searchDocuments(query: string) {
    if (!indexUid.value || !query.trim()) {
        documentOptions.value = []
        return
    }

    const requestedIndex = indexUid.value
    const requestedQuery = query
    isSearching.value = true

    try {
        const client = store.getClient()
        const results = client
            ? await client.index(requestedIndex).search(query, { limit: 20 })
            : null

        if (open.value && indexUid.value === requestedIndex && searchTerm.value === requestedQuery) {
            documentOptions.value = (results?.hits ?? []).map(document => {
                const id = document[primaryKey.value]

                return {
                    label: String(id ?? 'Unknown'),
                    value: String(id ?? ''),
                    preview: documentPreview(document),
                    document,
                    onSelect: () => selectDocument(document),
                }
            }).filter(option => option.value)
        }
    } catch {
        documentOptions.value = []
    } finally {
        isSearching.value = false
    }
}

const debouncedSearch = useDebounceFn(searchDocuments, 300)

function changeIndex() {
    previewRequestId++
    isPreviewing.value = false
    documentId.value = ''
    searchTerm.value = ''
    documentOptions.value = []
    selectedDocument.value = null
    previewError.value = null
}

function selectDocument(document: RecordAny) {
    documentId.value = String(document[primaryKey.value] ?? '')
    selectedDocument.value = document
    previewError.value = null
}

async function previewTypedDocument() {
    const id = documentId.value.trim()
    if (!indexUid.value || !id) {
        selectedDocument.value = null
        previewError.value = null
        return
    }

    const option = documentOptions.value.find(item => item.value === id)
    if (option) {
        selectDocument(option.document)
        return
    }

    const requestedIndex = indexUid.value
    const requestedId = id
    const requestId = ++previewRequestId
    const client = store.getClient()
    if (!client) return

    isPreviewing.value = true
    previewError.value = null

    try {
        const document = await client.index(requestedIndex).getDocument(requestedId)
        if (requestId === previewRequestId && open.value && indexUid.value === requestedIndex && documentId.value.trim() === requestedId) {
            selectedDocument.value = document
        }
    } catch {
        if (requestId === previewRequestId && open.value && indexUid.value === requestedIndex && documentId.value.trim() === requestedId) {
            selectedDocument.value = null
            previewError.value = `Document "${requestedId}" was not found.`
        }
    } finally {
        if (requestId === previewRequestId) {
            isPreviewing.value = false
        }
    }
}

async function initializeForm() {
    resetForm()
    void fetchAllIndexes()
    await nextTick()
    await previewTypedDocument()
}

function save() {
    if (!canSave.value || position.value === null) return

    action.value = {
        selector: { indexUid: indexUid.value, id: documentId.value.trim() },
        action: { type: 'pin', position: position.value },
    }
    open.value = false
    emit('save')
}

watch(searchTerm, term => {
    debouncedSearch(term)
})

watch(documentId, id => {
    if (String(selectedDocument.value?.[primaryKey.value] ?? '') !== id) {
        previewRequestId++
        isPreviewing.value = false
        selectedDocument.value = null
    }
    previewError.value = null
})

watch(open, value => {
    if (value) {
        void initializeForm()
    } else {
        previewRequestId++
        isPreviewing.value = false
    }
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="Action"
        :ui="{ content: 'sm:max-w-lg' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <UFormField label="Action type">
                    <UInput
                        model-value="Pin"
                        disabled
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Index">
                    <USelect
                        v-model="indexUid"
                        :items="indexes"
                        value-key="uid"
                        label-key="uid"
                        placeholder="Select an index"
                        class="w-full"
                        @update:model-value="changeIndex"
                    />
                </UFormField>

                <template v-if="indexUid">
                    <UFormField
                        label="Document ID"
                        help="Search for a document or enter an exact ID."
                    >
                        <UInputMenu
                            v-model="documentId"
                            v-model:search-term="searchTerm"
                            mode="autocomplete"
                            aria-label="Document ID"
                            :items="documentOptions"
                            value-key="value"
                            label-key="label"
                            :loading="isSearching"
                            :content="{ hideWhenEmpty: true }"
                            ignore-filter
                            icon="i-lucide-search"
                            placeholder="Search documents or enter an ID..."
                            class="w-full"
                            @keydown.enter.prevent="previewTypedDocument"
                        >
                            <template #item-label="{ item }">
                                <div class="flex min-w-0 flex-col">
                                    <span class="font-medium">{{ item.label }}</span>
                                    <span class="truncate text-xs text-muted">{{ item.preview }}</span>
                                </div>
                            </template>
                        </UInputMenu>
                    </UFormField>

                    <div
                        v-if="selectedDocument"
                        class="flex flex-col gap-2"
                    >
                        <p class="text-sm font-medium text-default">
                            Selected document
                        </p>
                        <div class="max-h-52 overflow-auto rounded-md border border-default">
                            <ThemedJsonViewer :data="selectedDocument" />
                        </div>
                    </div>

                    <p
                        v-else-if="isPreviewing"
                        class="text-sm text-muted"
                    >
                        Loading document preview...
                    </p>
                    <UAlert
                        v-else-if="previewError"
                        color="warning"
                        variant="subtle"
                        :title="previewError"
                    />
                </template>

                <UFormField
                    label="Position"
                    help="Zero-based pin position."
                >
                    <UInputNumber
                        v-model="position"
                        :min="0"
                        :step="1"
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
                    @click="open = false"
                />
                <UButton
                    label="Save"
                    :disabled="!canSave"
                    @click="save"
                />
            </div>
        </template>
    </UModal>
</template>
