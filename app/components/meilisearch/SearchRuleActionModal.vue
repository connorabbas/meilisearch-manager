<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useDebounceFn } from '@vueuse/core'
import type { Filter, RecordAny } from 'meilisearch'
import type { RuleActionEntry } from '@/types/search-rules'
import type { SearchRuleDocumentOption } from '@/types'
import ThemedJsonViewer from '@/components/ThemedJsonViewer.vue'
import DocumentFilterBuilder from '@/components/meilisearch/DocumentFilterBuilder.vue'
import { compileGroups, createFilterBuilderState, filterFields } from '@/utils/documentFilters'
import type { FilterField } from '@/utils/documentFilters'
import { MIN_SEARCH_RULE_VERSION } from '@/types/search-rules'

const open = defineModel<boolean>('open', { default: false })
const action = defineModel<RuleActionEntry>('action', { required: true })
const emit = defineEmits<{ save: [] }>()

const store = useMeilisearchStore()
const { indexes, fetchAllIndexes } = useIndexes()
const indexUid = ref('')
const ANY_INDEX = '__any index__'
const indexOptions = computed(() => [
    ...(actionType.value === 'scale' ? [{ label: 'Any', value: ANY_INDEX }] : []),
    ...indexes.value.map(index => ({ label: index.uid, value: index.uid })),
])
const selectedIndexUid = computed({
    get: () => indexUid.value || (actionType.value === 'scale' ? ANY_INDEX : undefined),
    set: (value: string | undefined) => {
        indexUid.value = value === ANY_INDEX ? '' : value ?? ''
        changeIndex()
    },
})
const documentId = ref('')
const searchTerm = ref('')
const documentOptions = ref<SearchRuleDocumentOption[]>([])
const selectedDocument = ref<RecordAny | null>(null)
const previewError = ref<string | null>(null)
const isPreviewing = ref(false)
const position = ref<number | null>(0)
const actionType = ref<'pin' | 'scale'>('pin')
const ids = ref('')
const filterText = ref('')
const builderOpen = ref(false)
const builderState = ref(createFilterBuilderState())
const builderFields = ref<FilterField[]>([])
const builderLoading = ref(false)
const builderError = ref<string | null>(null)
let builderRequestId = 0
const builderExpression = computed(() => {
    try {
        return { value: compileGroups(builderState.value.groups, builderState.value.join, builderFields.value, MIN_SEARCH_RULE_VERSION), error: null }
    } catch (error) {
        return { value: null, error: (error as Error).message }
    }
})
const weight = ref<number | null>(2)
const parsedFilter = computed<Filter | undefined>(() => {
    const text = filterText.value.trim()
    if (!text) return undefined
    if (!text.startsWith('[')) return text
    try {
        const value: unknown = JSON.parse(text)
        return Array.isArray(value) && value.length > 0
            && value.every(part => typeof part === 'string' && !!part.trim()
                || Array.isArray(part) && part.length > 0 && part.every(item => typeof item === 'string' && !!item.trim()))
            ? value as Filter : undefined
    } catch { return undefined }
})
const parsedIds = computed(() => ids.value.split(/[\n,]+/).map(id => id.trim()).filter(Boolean))
const scaleEffect = computed(() => weight.value === 0 ? 'Hide' : weight.value === 1 ? 'Unchanged' : (weight.value ?? 0) > 1 ? 'Boost' : 'Demote')
const isSearching = ref(false)
let previewRequestId = 0

const selectedIndex = computed(() => {
    return indexes.value.find(index => index.uid === indexUid.value)
})
const primaryKey = computed(() => selectedIndex.value?.primaryKey ?? 'id')
const canSave = computed(() => {
    return actionType.value === 'scale'
        ? weight.value !== null && Number.isFinite(weight.value) && weight.value >= 0
        && (!filterText.value.trim() || !!parsedFilter.value)
        && (parsedIds.value.length > 0 || !!parsedFilter.value)
        : !!indexUid.value && !!documentId.value.trim()
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
    resetBuilder()
    previewRequestId++
    isPreviewing.value = false
    actionType.value = action.value.type
    indexUid.value = action.value.value.indexUid ?? ''
    documentId.value = action.value.type === 'pin' ? action.value.value.id : ''
    ids.value = action.value.type === 'scale' ? action.value.value.ids?.join('\n') ?? '' : ''
    filterText.value = action.value.type === 'scale'
        ? typeof action.value.value.filter === 'string' ? action.value.value.filter : action.value.value.filter ? JSON.stringify(action.value.value.filter) : ''
        : ''
    weight.value = action.value.type === 'scale' ? action.value.value.weight : 2
    searchTerm.value = ''
    documentOptions.value = []
    selectedDocument.value = null
    previewError.value = null
    position.value = action.value.type === 'pin' ? action.value.value.position : 0
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
    resetBuilder()
    previewRequestId++
    isPreviewing.value = false
    documentId.value = ''
    searchTerm.value = ''
    documentOptions.value = []
    selectedDocument.value = null
    previewError.value = null
}

function resetBuilder() {
    builderRequestId++
    builderOpen.value = false
    builderState.value = createFilterBuilderState()
    builderFields.value = []
    builderError.value = null
    builderLoading.value = false
}

async function openBuilder() {
    if (!indexUid.value) return
    const uid = indexUid.value
    builderOpen.value = true
    builderLoading.value = true
    builderError.value = null
    const requestId = ++builderRequestId
    const client = store.getClient()
    if (!client) {
        builderLoading.value = false
        builderError.value = 'Meilisearch client not connected.'
        return
    }
    try {
        const index = client.index(uid)
        const [settings, documents] = await Promise.all([
            index.getFilterableAttributes(),
            index.getDocuments({ limit: 1 }).catch(() => null),
        ])
        if (requestId !== builderRequestId || !builderOpen.value || indexUid.value !== uid) return
        builderFields.value = filterFields(settings, Object.keys(documents?.results[0] ?? {}))
    } catch (error) {
        if (requestId === builderRequestId) builderError.value = (error as Error).message
    } finally {
        if (requestId === builderRequestId) builderLoading.value = false
    }
}

function useBuiltFilter() {
    if (!builderExpression.value.value || builderExpression.value.error || builderLoading.value) return
    filterText.value = builderExpression.value.value
    builderOpen.value = false
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
    if (actionType.value === 'pin') await previewTypedDocument()
}

function save() {
    if (!canSave.value) return

    if (actionType.value === 'pin') {
        action.value = { type: 'pin', value: { indexUid: indexUid.value, id: documentId.value.trim(), position: position.value! } }
    } else {
        action.value = {
            type: 'scale', value: {
                ...(indexUid.value ? { indexUid: indexUid.value } : {}),
                ...(parsedIds.value.length ? { ids: parsedIds.value } : {}),
                ...(parsedFilter.value ? { filter: parsedFilter.value } : {}),
                weight: weight.value!,
            }
        }
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
        resetBuilder()
    }
})
watch(builderOpen, value => {
    if (!value) {
        builderRequestId++
        builderLoading.value = false
    }
}, { flush: 'sync' })
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
                    <USelect
                        v-model="actionType"
                        :items="[{ label: 'Pin', value: 'pin' }, { label: 'Scale', value: 'scale' }]"
                        value-key="value"
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Index">
                    <USelect
                        v-model="selectedIndexUid"
                        :items="indexOptions"
                        value-key="value"
                        label-key="label"
                        placeholder="Select an index"
                        class="w-full"
                    />
                </UFormField>

                <template v-if="actionType === 'pin' && indexUid">
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
                        <div class="max-h-52 overflow-auto rounded-[var(--ui-radius)] border border-default">
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
                        icon="i-lucide-triangle-alert"
                        :title="previewError"
                    />
                </template>

                <UFormField
                    v-if="actionType === 'pin'"
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
                <template v-else>
                    <p class="text-sm text-muted">Enter at least one document ID or a document filter. When both are set, documents must match both.</p>
                    <UFormField
                        label="Document IDs"
                        help="Separate IDs with commas or new lines."
                    >
                        <UTextarea
                            v-model="ids"
                            placeholder="doc1, doc2"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField
                        label="Document filter"
                        help="Optional Meilisearch filter expression, or JSON array of filter expressions. Attributes must be filterable."
                    >
                        <UTextarea
                            v-model="filterText"
                            placeholder="available = true"
                            class="w-full"
                        />
                    </UFormField>
                    <UButton
                        label="Build filter"
                        icon="i-lucide-list-filter"
                        variant="outline"
                        class="self-start"
                        :disabled="!indexUid"
                        @click="openBuilder"
                    />
                    <UAlert
                        v-if="!indexUid"
                        color="info"
                        variant="subtle"
                        icon="i-lucide-info"
                        title="Select an index to build a filter, or enter an expression manually."
                    />
                    <p
                        v-if="filterText.trim() && !parsedFilter"
                        class="text-sm text-error"
                    >Enter a valid filter expression or JSON array.</p>
                    <UAlert
                        v-if="!parsedIds.length && !parsedFilter && !filterText.trim()"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-circle-x"
                        title="Enter at least one document ID or a document filter."
                    />
                    <UFormField
                        label="Weight"
                        :help="`${scaleEffect}: >1 boosts, between 0 and 1 demotes, 0 hides (unless pinned).`"
                    >
                        <UInputNumber
                            v-model="weight"
                            :min="0"
                            :step="0.1"
                            class="w-full"
                        />
                    </UFormField>
                </template>
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
    <UModal
        v-model:open="builderOpen"
        title="Build document filter"
        :ui="{ content: 'sm:max-w-3xl' }"
    >
        <template #body>
            <div
                v-if="builderLoading"
                class="flex justify-center p-8"
            >
                <USkeleton class="h-8 w-48" />
            </div>
            <UAlert
                v-else-if="builderError"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-x"
                title="Unable to load filterable attributes"
                :description="builderError"
            />
            <DocumentFilterBuilder
                v-else
                v-model:state="builderState"
                :fields="builderFields"
                :version="MIN_SEARCH_RULE_VERSION"
                :expression="builderExpression"
            />
        </template>
        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    @click="builderOpen = false"
                />
                <UButton
                    label="Use filter"
                    :disabled="builderLoading || !!builderError || !builderExpression.value"
                    @click="useBuiltFilter"
                />
            </div>
        </template>
    </UModal>
</template>
