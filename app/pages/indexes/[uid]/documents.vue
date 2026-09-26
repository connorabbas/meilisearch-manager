<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TabsItem } from '@nuxt/ui'
import type { Embedder, RecordAny } from 'meilisearch'
import { useDebounceFn } from '@vueuse/core'
import DocumentHitJsonRow from '@/components/meilisearch/DocumentHitJsonRow.vue'
import DocumentsGeoMap from '@/components/meilisearch/DocumentsGeoMap.vue'
import EditDocumentSlideover from '@/components/meilisearch/EditDocumentSlideover.vue'
import ExportDocumentsModal from '@/components/meilisearch/ExportDocumentsModal.vue'
import FilterDocumentsSlideover from '@/components/meilisearch/FilterDocumentsSlideover.vue'
import HybridSearchModal from '@/components/meilisearch/HybridSearchModal.vue'
import ImportDocumentsSlideover from '@/components/meilisearch/ImportDocumentsSlideover.vue'
import { useDocuments } from '@/composables/meilisearch/useDocuments'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useSearch } from '@/composables/meilisearch/useSearch'
import { useSettings } from '@/composables/meilisearch/useSettings'
import { useStats } from '@/composables/meilisearch/useStats'
import type { DocumentDataView, IndexEmbedderOption, SortOption } from '@/types'
import { getRankingScoreColor, looksLikeAnImageUrl } from '@/utils'

definePageMeta({ layout: 'app', title: 'Index Documents' })

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))

const { currentIndex, fetchIndex } = useIndexes()
const { isSendingTask, confirmDeleteDocument } = useDocuments()
const { indexStats, fetchIndexStats } = useStats()
const {
    sortableAttributes,
    filterableAttributes,
    embedders,
    pagination,
    isFetching: isFetchingSettings,
    fetchSortableAttributes,
    fetchFilterableAttributes,
    fetchEmbedders,
    fetchPagination,
} = useSettings()
const {
    currentPage,
    perPage,
    paginationSummary,
    searchResults,
    searchQuery,
    searchSort,
    searchGeoSort,
    searchFilter,
    hybridSearchEnabled,
    hybridSearchConfig,
    showRankingScore,
    isFetching: isSearching,
    error: searchError,
    searchPaginated,
    paginate,
} = useSearch(20, { maxTotalHits: computed(() => pagination.value.maxTotalHits) })

const dataView = ref<DataView>('json')

const primaryKey = computed(() => currentIndex.value?.primaryKey)
const hits = computed<RecordAny[]>(() => searchResults.value?.hits ?? [])
const totalHits = computed(() => Math.min(
    searchResults.value?.estimatedTotalHits ?? 0,
    pagination.value.maxTotalHits ?? Number.POSITIVE_INFINITY,
))

async function fetchData() {
    await Promise.all([
        fetchIndex(indexUid.value),
        fetchIndexStats(indexUid.value),
        fetchPagination(indexUid.value),
    ])
    await searchPaginated(indexUid.value)
}
await fetchData()

const hasGeoView = computed(() => {
    const fields = Object.keys(indexStats.value?.fieldDistribution ?? {})
    return fields.includes('_geo') || fields.includes('_geojson')
})
const dataViewOptions = computed<TabsItem[]>(() => [
    { label: 'JSON', value: 'json', icon: 'i-lucide-braces' },
    { label: 'Table', value: 'table', icon: 'i-lucide-table-2' },
    ...(hasGeoView.value ? [{ label: 'Geo', value: 'geo', icon: 'i-lucide-map' }] : []),
])

const debouncedSearch = useDebounceFn(() => searchPaginated(indexUid.value, true), 300)
watch(searchQuery, value => value ? debouncedSearch() : searchPaginated(indexUid.value, true))

const NO_SORT_VALUE = '__no_sort__'
const standardSortableAttributes = computed(() => (sortableAttributes.value ?? []).filter(attribute => attribute !== '_geo'))
const sortingOptions = computed<SortOption[]>(() => standardSortableAttributes.value.length
    ? [
        { value: NO_SORT_VALUE, label: 'Default Sort' },
        ...standardSortableAttributes.value.flatMap(attribute => [
            { value: `${attribute}:asc`, label: `${attribute}:asc` },
            { value: `${attribute}:desc`, label: `${attribute}:desc` },
        ]),
    ]
    : [])
const selectedSort = computed<string | undefined>({
    get: () => standardSortableAttributes.value.length ? searchSort.value[0] ?? NO_SORT_VALUE : undefined,
    set: (value) => { searchSort.value = value && value !== NO_SORT_VALUE ? [value] : [] },
})
async function updateSort(value: string) {
    selectedSort.value = value
    await searchPaginated(indexUid.value, true)
}

const filterSlideoverOpen = ref(false)
const importSlideoverOpen = ref(false)
const exportModalOpen = ref(false)
const editSlideoverOpen = ref(false)
const currentDocument = ref<RecordAny | null>(null)
const hybridModalOpen = ref(false)
const searchOptionsOpen = ref(false)

watch(searchFilter, () => searchPaginated(indexUid.value, true))
watch(searchGeoSort, () => searchPaginated(indexUid.value, true))
watch(hasGeoView, (value) => {
    if (!value && dataView.value === 'geo') dataView.value = 'json'
}, { immediate: true })

function editDocument(document: RecordAny) {
    currentDocument.value = document
    editSlideoverOpen.value = true
}
watch(editSlideoverOpen, (open) => {
    if (!open && !isSendingTask.value) setTimeout(() => { currentDocument.value = null }, 250)
})
function deleteDocument(documentId: string | number) {
    confirmDeleteDocument(indexUid.value, documentId, () => {
        void Promise.all([searchPaginated(indexUid.value), fetchIndexStats(indexUid.value)])
    })
}
function documentActions(document: RecordAny): DropdownMenuItem[] {
    return [
        { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => editDocument(document) },
        ...(primaryKey.value ? [{
            label: 'Delete',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => deleteDocument(document[primaryKey.value!]),
        }] : []),
    ]
}

function getEmbedderSource(embedder: NonNullable<Embedder>) {
    return embedder.source === 'composite'
        ? embedder.indexingEmbedder?.source ?? embedder.searchEmbedder?.source ?? embedder.source
        : embedder.source
}
function getEmbedderModel(embedder: NonNullable<Embedder>) {
    if ('model' in embedder) return embedder.model
    if (embedder.source === 'composite') {
        if (embedder.indexingEmbedder && 'model' in embedder.indexingEmbedder) return embedder.indexingEmbedder.model
        if (embedder.searchEmbedder && 'model' in embedder.searchEmbedder) return embedder.searchEmbedder.model
    }
}
const availableEmbedders = computed<IndexEmbedderOption[]>(() => Object.entries(embedders.value ?? {}).flatMap(([name, settings]) => {
    if (!settings) return []
    const details = [getEmbedderSource(settings), getEmbedderModel(settings)].filter(Boolean).join(', ')
    return [{ name, label: details ? `${name} (${details})` : name, settings }]
}))
watch(hybridSearchEnabled, (enabled) => {
    if (enabled && availableEmbedders.value.length) hybridModalOpen.value = true
    else if (enabled) hybridSearchEnabled.value = false
    else {
        hybridModalOpen.value = false
        hybridSearchConfig.value = null
    }
})
watch(hybridSearchConfig, () => searchPaginated(indexUid.value, true))
watch(hybridModalOpen, open => { if (!open && hybridSearchEnabled.value && !hybridSearchConfig.value) hybridSearchEnabled.value = false })
watch(availableEmbedders, (value) => {
    if (!value.some(embedder => embedder.name === hybridSearchConfig.value?.embedder)) {
        hybridSearchEnabled.value = false
        hybridSearchConfig.value = null
        hybridModalOpen.value = false
    }
})

const fieldNames = computed(() => Object.keys(indexStats.value?.fieldDistribution ?? {}))
const dynamicFields = computed(() => fieldNames.value.filter(field => field !== primaryKey.value))
const columns = computed<TableColumn<RecordAny>[]>(() => [
    ...(primaryKey.value ? [{ accessorKey: primaryKey.value, header: primaryKey.value, id: 'primaryKey' }] : []),
    ...(showRankingScore.value ? [
        { id: 'rankingScore', header: 'Ranking Score' },
        { id: 'rankingDetails', header: 'Ranking Details' },
    ] : []),
    ...dynamicFields.value.map((field, index) => ({ id: `field-${index}`, header: field })),
    { id: 'actions', size: 72, minSize: 72, maxSize: 72, meta: { class: { th: 'text-end', td: 'text-end' } } },
])
const columnPinning = computed(() => ({
    left: primaryKey.value ? ['primaryKey'] : [],
    right: ['actions'],
}))

function displayValue(value: unknown) {
    if (value === null) return 'null'
    if (value === undefined) return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

async function changePage(page: number) {
    await paginate(
        page,
        perPage.value,
        () => searchPaginated(indexUid.value),
        true,
        dataView.value === 'table' ? 'documents-table-scroll' : undefined,
    )
}
async function changePageSize(pageSize: number) {
    await paginate(
        currentPage.value,
        pageSize,
        () => searchPaginated(indexUid.value),
        true,
        dataView.value === 'table' ? 'documents-table-scroll' : undefined,
    )
}
async function toggleRanking() {
    searchOptionsOpen.value = false
    showRankingScore.value = !showRankingScore.value
    await searchPaginated(indexUid.value, true)
}
function openFilters() {
    searchOptionsOpen.value = false
    filterSlideoverOpen.value = true
}
function toggleHybridSearch() {
    searchOptionsOpen.value = false
    hybridSearchEnabled.value = !hybridSearchEnabled.value
}

onMounted(() => {
    void Promise.all([
        fetchEmbedders(indexUid.value),
        fetchSortableAttributes(indexUid.value),
        fetchFilterableAttributes(indexUid.value),
    ])
})
</script>

<template>
    <div
        class="flex min-h-full flex-col gap-4"
        :class="{ 'shrink-0': dataView === 'json' }"
    >
        <Teleport to="#sub-page-actions">
            <AppPageActions>
                <UButton
                    v-if="indexStats?.numberOfDocuments"
                    label="Export Documents"
                    icon="i-lucide-download"
                    color="neutral"
                    variant="outline"
                    @click="exportModalOpen = true"
                />
                <UButton
                    label="Import Documents"
                    icon="i-lucide-plus"
                    @click="importSlideoverOpen = true"
                />
            </AppPageActions>
        </Teleport>

        <Teleport to="#sub-page-toolbar">
            <UDashboardToolbar
                :ui="{
                    root: 'min-w-0 flex-wrap py-3',
                    left: 'min-w-0 w-full flex-wrap xl:flex-1 gap-2',
                    right: 'min-w-0 w-full flex-wrap justify-between xl:w-auto xl:justify-start gap-2'
                }"
            >
                <template #left>
                    <UInput
                        v-model="searchQuery"
                        role="searchbox"
                        icon="i-lucide-search"
                        placeholder="Search documents"
                        aria-label="Search documents"
                        autofocus
                        class="w-full xl:max-w-96"
                        :ui="{ trailing: 'pe-1' }"
                        @keyup.enter="searchPaginated(indexUid, true)"
                    >
                        <template
                            v-if="searchQuery"
                            #trailing
                        >
                            <UButton
                                color="neutral"
                                variant="link"
                                size="sm"
                                icon="i-lucide-circle-x"
                                aria-label="Clear search"
                                @click="searchQuery = ''"
                            />
                        </template>
                    </UInput>
                    <UBadge
                        color="neutral"
                        variant="soft"
                        size="xl"
                        class="hidden xl:inline-flex"
                        :label="`${totalHits.toLocaleString('en-US')} total hits`"
                    />
                </template>
                <template #right>
                    <div class="hidden items-center gap-2 xl:flex">
                        <USelect
                            :model-value="selectedSort"
                            :items="sortingOptions"
                            :loading="isFetchingSettings.sortableAttributes"
                            placeholder="Sort by"
                            aria-label="Sort documents"
                            class="w-44"
                            @update:model-value="updateSort(String($event))"
                        >
                            <template #content-bottom>
                                <p
                                    v-if="standardSortableAttributes.length === 0"
                                    class="border-t border-default p-2 text-sm text-muted"
                                >
                                    Update the index settings to enable sorting.
                                </p>
                            </template>
                        </USelect>
                        <UChip
                            :show="Boolean(searchFilter || searchGeoSort)"
                            size="2xl"
                        >
                            <UButton
                                label="Filter"
                                icon="i-lucide-funnel"
                                color="neutral"
                                variant="outline"
                                @click="openFilters"
                            />
                        </UChip>
                        <UTooltip
                            v-if="availableEmbedders.length"
                            text="Hybrid search"
                        >
                            <UButton
                                aria-label="Toggle hybrid search"
                                icon="i-lucide-sparkles"
                                :color="hybridSearchEnabled ? 'primary' : 'neutral'"
                                :variant="hybridSearchEnabled ? 'soft' : 'outline'"
                                :aria-pressed="hybridSearchEnabled"
                                @click="toggleHybridSearch"
                            />
                        </UTooltip>
                        <UTooltip text="Show ranking score">
                            <UButton
                                aria-label="Toggle ranking score"
                                icon="i-lucide-trophy"
                                :color="showRankingScore ? 'primary' : 'neutral'"
                                :variant="showRankingScore ? 'soft' : 'outline'"
                                :aria-pressed="showRankingScore"
                                @click="toggleRanking"
                            />
                        </UTooltip>
                    </div>
                    <UTabs
                        v-model="dataView"
                        :items="dataViewOptions"
                        :content="false"
                        size="sm"
                        aria-label="Document view"
                    />
                    <UPopover
                        v-model:open="searchOptionsOpen"
                        class="xl:hidden"
                        :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
                    >
                        <UButton
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                            square
                            aria-label="Open search options"
                        />
                        <template #content>
                            <div class="flex min-w-56 flex-col items-stretch gap-4 p-4">
                                <USelect
                                    :model-value="selectedSort"
                                    :items="sortingOptions"
                                    :loading="isFetchingSettings.sortableAttributes"
                                    :modal="false"
                                    placeholder="Sort by"
                                    aria-label="Sort documents"
                                    class="w-full"
                                    @update:model-value="updateSort(String($event))"
                                >
                                    <template #content-bottom>
                                        <p
                                            v-if="standardSortableAttributes.length === 0"
                                            class="border-t border-default p-2 text-sm text-muted"
                                        >
                                            Update the index settings to enable sorting.
                                        </p>
                                    </template>
                                </USelect>
                                <UChip
                                    :show="Boolean(searchFilter || searchGeoSort)"
                                    inset
                                >
                                    <UButton
                                        label="Filter"
                                        icon="i-lucide-funnel"
                                        color="neutral"
                                        variant="outline"
                                        class="w-full justify-center"
                                        @click="openFilters"
                                    />
                                </UChip>
                                <UButton
                                    v-if="availableEmbedders.length"
                                    label="Hybrid search"
                                    aria-label="Toggle hybrid search"
                                    icon="i-lucide-sparkles"
                                    :color="hybridSearchEnabled ? 'primary' : 'neutral'"
                                    :variant="hybridSearchEnabled ? 'soft' : 'outline'"
                                    :aria-pressed="hybridSearchEnabled"
                                    class="w-full justify-center"
                                    @click="toggleHybridSearch"
                                />
                                <UButton
                                    label="Show ranking score"
                                    aria-label="Toggle ranking score"
                                    icon="i-lucide-trophy"
                                    :color="showRankingScore ? 'primary' : 'neutral'"
                                    :variant="showRankingScore ? 'soft' : 'outline'"
                                    :aria-pressed="showRankingScore"
                                    class="w-full justify-center"
                                    @click="toggleRanking"
                                />
                            </div>
                        </template>
                    </UPopover>
                </template>
            </UDashboardToolbar>
        </Teleport>

        <Teleport to="body">
            <ImportDocumentsSlideover
                v-model:open="importSlideoverOpen"
                :index-uid="indexUid"
                :primary-key="currentIndex?.primaryKey"
                @documents-imported="fetchData"
            />
            <ExportDocumentsModal
                v-model:open="exportModalOpen"
                :index-uid="indexUid"
            />
            <EditDocumentSlideover
                v-if="currentDocument"
                v-model:open="editSlideoverOpen"
                :index-uid="indexUid"
                :primary-key="currentIndex?.primaryKey"
                :document="currentDocument"
                @document-updated="fetchData"
            />
            <FilterDocumentsSlideover
                v-model:open="filterSlideoverOpen"
                v-model:filter="searchFilter"
                v-model:geo-sort="searchGeoSort"
                :index-uid="indexUid"
                :filterable-attributes="filterableAttributes"
                :sortable-attributes="sortableAttributes"
                :searching="isSearching"
                :enable-geo-filters="dataView === 'geo'"
                :total-hits="totalHits"
            />
            <HybridSearchModal
                v-if="availableEmbedders.length"
                v-model:open="hybridModalOpen"
                v-model:hybrid-search="hybridSearchConfig"
                :embedders="availableEmbedders"
                @cancel="hybridSearchEnabled = false"
            />
        </Teleport>

        <UAlert
            v-if="searchError"
            variant="subtle"
            color="error"
            icon="i-lucide-circle-x"
            title="Unable to search documents"
            :description="searchError"
            :actions="[{ label: 'Retry', onClick: () => searchPaginated(indexUid) }]"
        />

        <div
            v-if="isSearching && !hits.length"
            class="flex min-h-64 flex-col items-center justify-center gap-4 text-muted"
        >
            <UIcon
                name="i-lucide-loader-circle"
                class="size-8 animate-spin motion-reduce:animate-none"
            />
            <span>Loading documents…</span>
        </div>

        <UCard
            v-else-if="dataView === 'table'"
            variant="outline"
            class="flex min-h-80 min-w-0 flex-1 flex-col"
            :ui="{
                body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0',
                footer: 'shrink-0 border-t border-default',
            }"
        >
            <UTable
                id="documents-table-scroll"
                :data="hits"
                :columns="columns"
                :column-pinning="columnPinning"
                :get-row-id="(row, index) => primaryKey && row[primaryKey] != null ? String(row[primaryKey]) : String(index)"
                :loading="isSearching"
                empty="No documents found"
                sticky
                class="min-h-0 flex-1"
                :ui="{ root: 'h-full' }"
            >
                <template #rankingScore-cell="{ row }">
                    <UBadge
                        v-if="row.original._rankingScore !== undefined"
                        :label="`${Math.round(row.original._rankingScore * 100)}%`"
                        :color="getRankingScoreColor(row.original._rankingScore)"
                        variant="subtle"
                    />
                </template>
                <template #rankingDetails-cell="{ row }">
                    <UPopover v-if="row.original._rankingScoreDetails !== undefined">
                        <UButton
                            label="View details"
                            color="neutral"
                            variant="link"
                            size="sm"
                        />
                        <template #content>
                            <div class="max-h-[35rem] w-[min(35rem,calc(100vw-2rem))] overflow-auto p-3">
                                <ThemedJsonViewer
                                    :data="{ _rankingScoreDetails: row.original._rankingScoreDetails }"
                                    expanded
                                    :expand-depth="9999"
                                />
                            </div>
                        </template>
                    </UPopover>
                </template>
                <template
                    v-for="(field, index) in dynamicFields"
                    :key="field"
                    #[`field-${index}-cell`]="{ row }"
                >
                    <template v-if="looksLikeAnImageUrl(row.original[field])">
                        <PreviewImage
                            :src="String(row.original[field])"
                            :alt="`${field} document image`"
                            :title="field"
                        />
                    </template>
                    <UPopover v-else>
                        <UButton
                            :label="displayValue(row.original[field])"
                            :aria-label="`View ${field} value`"
                            color="neutral"
                            variant="link"
                            class="max-w-52 justify-start truncate p-0"
                        />
                        <template #content>
                            <div class="max-h-[35rem] max-w-[min(35rem,calc(100vw-2rem))] overflow-auto p-3">
                                <ThemedJsonViewer
                                    v-if="row.original[field] !== null && typeof row.original[field] === 'object'"
                                    :data="{ [field]: row.original[field] }"
                                    expanded
                                    :expand-depth="9999"
                                />
                                <pre
                                    v-else
                                    class="whitespace-pre-wrap text-sm"
                                >{{ displayValue(row.original[field]) }}</pre>
                            </div>
                        </template>
                    </UPopover>
                </template>
                <template #actions-cell="{ row }">
                    <UDropdownMenu :items="documentActions(row.original)">
                        <UButton
                            aria-label="Show document actions"
                            icon="i-lucide-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdownMenu>
                </template>
            </UTable>
            <template #footer>
                <AppTablePagination
                    :page="currentPage"
                    :per-page="perPage"
                    :total="totalHits"
                    :summary="paginationSummary"
                    :disabled="isSearching"
                    show-edges
                    @page="changePage"
                    @per-page="changePageSize"
                />
            </template>
        </UCard>

        <div
            v-else-if="hits.length"
            class="flex flex-col gap-4"
            :class="{ 'min-h-0 flex-1': dataView === 'geo' }"
        >
            <UCard
                v-if="dataView === 'geo'"
                variant="outline"
                class="flex min-h-80 flex-1 flex-col"
                :ui="{ body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0' }"
            >
                <ClientOnly>
                    <DocumentsGeoMap
                        :hits="hits"
                        :primary-key="primaryKey"
                    />
                </ClientOnly>
            </UCard>
            <div
                v-else
                class="grid grid-cols-1 gap-4"
            >
                <DocumentHitJsonRow
                    v-for="(hit, index) in hits"
                    :key="(primaryKey && hit[primaryKey]) ?? index"
                    :hit="hit"
                    :primary-key="primaryKey"
                    :show-ranking-score="showRankingScore"
                    @edit="editDocument"
                    @delete="deleteDocument"
                />
            </div>
            <UCard variant="outline">
                <AppTablePagination
                    :page="currentPage"
                    :per-page="perPage"
                    :total="totalHits"
                    :summary="paginationSummary"
                    :disabled="isSearching"
                    show-edges
                    @page="changePage"
                    @per-page="changePageSize"
                />
            </UCard>
        </div>

        <UEmpty
            v-else-if="!isSearching && !searchError"
            icon="i-lucide-file-search"
            title="No documents found"
            description="Try another search query or adjust the active filters."
        />
    </div>
</template>
