<script setup lang="ts">
import { Astroid, Download, EllipsisVertical, Funnel, Pencil, Plus, Search, Trash2, Trophy } from '@lucide/vue'
import type { IndexEmbedderOption, MenuItem } from '@/types'
import { useDebounceFn } from '@vueuse/core'
import { useSearch } from '@/composables/meilisearch/useSearch'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useStats } from '@/composables/meilisearch/useStats'
import { useDocuments } from '@/composables/meilisearch/useDocuments'
import { useSettings } from '@/composables/meilisearch/useSettings'
import type { Embedder, RecordAny } from 'meilisearch'
import DocumentHitJsonRow from '@/components/meilisearch/DocumentHitJsonRow.vue'
import Menu from '@/components/router-link-menus/Menu.vue'
import ImportDocumentsDrawer from '@/components/meilisearch/ImportDocumentsDrawer.vue'
import ExportDocumentsModal from '@/components/meilisearch/ExportDocumentsModal.vue'
import EditDocumentDrawer from '@/components/meilisearch/EditDocumentDrawer.vue'
import FilterDocumentsDrawer from '@/components/meilisearch/FilterDocumentsDrawer.vue'
import DocumentsGeoMap from '@/components/meilisearch/DocumentsGeoMap.vue'
import HybridSearchModal from '@/components/meilisearch/HybridSearchModal.vue'
import { looksLikeAnImageUrl, getRankingScoreSeverity } from '@/utils'

definePageMeta({
    layout: 'app',
    title: 'Index Documents',
})

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const { currentIndex, fetchIndex } = useIndexes()
const { isSendingTask, confirmDeleteDocument } = useDocuments()
const { indexStats, fetchIndexStats } = useStats()
const {
    sortableAttributes,
    filterableAttributes,
    embedders,
    isFetching: isFetchingSettings,
    fetchSortableAttributes,
    fetchFilterableAttributes,
    fetchEmbedders,
} = useSettings()
const {
    perPage,
    firstDatasetIndex,
    searchResults,
    searchQuery,
    searchSort,
    searchGeoSort,
    searchFilter,
    hybridSearchEnabled,
    hybridSearchConfig,
    showRankingScore,
    isFetching: isSearching,
    searchPaginated,
    handlePageEvent,
} = useSearch()

const primaryKey = computed(() => currentIndex.value?.primaryKey)
const totalHitsString = computed(() => `${searchResults.value?.estimatedTotalHits?.toLocaleString('en-US')} total hits`)

async function fetchData() {
    await Promise.all([
        fetchIndex(indexUid.value),
        searchPaginated(indexUid.value, true),
        fetchIndexStats(indexUid.value),
    ])
}
await fetchData()

const dataView = ref<'JSON' | 'Table' | 'Geo'>('JSON')
const hasGeoView = computed(() => {
    const fieldNames = Object.keys(indexStats.value?.fieldDistribution ?? {})
    return fieldNames.includes('_geo') || fieldNames.includes('_geojson')
})
const dataViewOptions = computed(() => {
    return hasGeoView.value
        ? ['JSON', 'Table', 'Geo']
        : ['JSON', 'Table']
})

// Search
const debouncedSearch = useDebounceFn(() => {
    searchPaginated(indexUid.value, true)
}, 300)
watch(searchQuery, (newValue) => {
    if (newValue) {
        debouncedSearch()
    } else if (newValue === '') {
        searchPaginated(indexUid.value, true)
    }
})

function handleDeleteDocument(documentId: string | number) {
    confirmDeleteDocument(indexUid.value, documentId, () => {
        void Promise.all([
            searchPaginated(indexUid.value),
            fetchIndexStats(indexUid.value),
        ])
    })
}

// Sorting
type SortOptions = {
    value: string[],
    label: string,
}
const sortMessage = computed(() => {
    if (sortingOptions.value.length > 0) {
        return 'Sort Documents'
    }
    return 'No sortable attributes available, please update the index settings'
})
// Basic single sort, TODO: use Multiselect for multi-sort?
const standardSortableAttributes = computed(() => {
    return (sortableAttributes.value ?? []).filter(attribute => attribute !== '_geo')
})
const sortingOptions = computed(() => {
    const options: SortOptions[] = []
    standardSortableAttributes.value.forEach((attribute) => {
        options.push({
            value: [`${attribute}:asc`],
            label: `${attribute}:asc`,
        })
        options.push({
            value: [`${attribute}:desc`],
            label: `${attribute}:desc`,
        })
    })

    return options
})

// Filtering
const showFilteringDrawerOpen = ref(false)
watch(searchFilter, () => {
    searchPaginated(indexUid.value, true)
})

// Create Drawer
const showImportDocumentsDrawerOpen = ref(false)

// Export Modal
const exportDocumentsModalOpen = ref(false)

// Edit / Details Drawer
const editDocumentDrawerOpen = ref(false)
const currentDocument = ref<RecordAny | null>()
function editDocument(document: RecordAny) {
    currentDocument.value = document
    editDocumentDrawerOpen.value = true
}
watch(editDocumentDrawerOpen, (isOpen) => {
    if (!isOpen && !isSendingTask.value) {
        setTimeout(() => {
            currentDocument.value = null
        }, 250)
    }
})

// Hybrid search
const hybridSearchModalOpen = ref(false)
function getEmbedderSource(embedder: NonNullable<Embedder>) {
    if (embedder.source !== 'composite') {
        return embedder.source
    }

    return embedder.indexingEmbedder?.source ?? embedder.searchEmbedder?.source ?? embedder.source
}
function getEmbedderModel(embedder: NonNullable<Embedder>) {
    if ('model' in embedder) {
        return embedder.model
    }

    if (embedder.source === 'composite') {
        const indexingEmbedder = embedder.indexingEmbedder
        const searchEmbedder = embedder.searchEmbedder

        if (indexingEmbedder && 'model' in indexingEmbedder) {
            return indexingEmbedder.model
        }
        if (searchEmbedder && 'model' in searchEmbedder) {
            return searchEmbedder.model
        }
    }
}
const availableEmbedders = computed<IndexEmbedderOption[]>(() => {
    return Object.entries(embedders.value ?? {}).flatMap(([name, settings]) => {
        if (!settings) {
            return []
        }

        const source = getEmbedderSource(settings)
        const model = getEmbedderModel(settings)
        const labelDetails = [source, model].filter(Boolean).join(', ')

        return [{
            name,
            label: labelDetails ? `${name} (${labelDetails})` : name,
            settings,
        }]
    })
})
watch(hybridSearchEnabled, (value) => {
    if (value) {
        if (availableEmbedders.value.length > 0) {
            hybridSearchModalOpen.value = true
        } else {
            hybridSearchEnabled.value = false
        }
    } else {
        hybridSearchModalOpen.value = false
        hybridSearchConfig.value = null
    }
})
watch(hybridSearchConfig, () => {
    searchPaginated(indexUid.value, true)
})
watch(hybridSearchModalOpen, (value) => {
    if (!value && hybridSearchEnabled.value && !hybridSearchConfig.value) {
        hybridSearchEnabled.value = false
    }
})
watch(availableEmbedders, (value) => {
    if (value.length === 0 || !value.some(embedder => embedder.name === hybridSearchConfig.value?.embedder)) {
        hybridSearchEnabled.value = false
        hybridSearchConfig.value = null
        hybridSearchModalOpen.value = false
    }
})
function handleHybridSearchCancel() {
    hybridSearchEnabled.value = false
}

// DataTable context Menu
const documentContextMenu = useTemplateRef('document-context-menu')
const documentContextMenuItems = ref<MenuItem[]>([])
function toggleDocumentContextMenu(event: Event, document: RecordAny) {
    documentContextMenuItems.value = [
        {
            label: 'Edit',
            lucideIcon: Pencil,
            command: () => editDocument(document),
        },
        {
            visible: Boolean(primaryKey.value),
            label: 'Delete',
            lucideIcon: Trash2,
            class: 'delete-menu-item',
            lucideIconClass: 'text-red-500 dark:text-red-400',
            command: () => {
                if (primaryKey.value) {
                    handleDeleteDocument(document[primaryKey.value])
                }
            },
        },
    ]
    if (documentContextMenu.value && documentContextMenu.value?.$el) {
        documentContextMenu.value.$el.toggle(event)
    }
}

// Popover
const fieldDetail = ref<RecordAny | null>()
const tableFieldDetailPopover = useTemplateRef('field-detail-popover')
function toggleTableFieldDetailPopover(event: Event, fieldName: string, fieldValue: RecordAny) {
    if (Array.isArray(fieldValue)) {
        fieldDetail.value = {}
        fieldDetail.value[fieldName] = fieldValue
    } else {
        fieldDetail.value = fieldValue
    }
    if (tableFieldDetailPopover.value) {
        tableFieldDetailPopover.value.toggle(event)
    }
}
function handleFieldPopoverHidden() {
    fieldDetail.value = null
}

// Geo
watch(searchGeoSort, () => {
    searchPaginated(indexUid.value, true)
})
watch(hasGeoView, (value) => {
    if (!value && dataView.value === 'Geo') {
        dataView.value = 'JSON'
    }
})

onMounted(() => {
    void fetchEmbedders(indexUid.value)
    void Promise.all([
        fetchSortableAttributes(indexUid.value),
        fetchFilterableAttributes(indexUid.value),
    ])
})
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <Teleport to="#sub-page-actions">
            <div class="flex gap-3">
                <Button
                    v-if="indexStats?.numberOfDocuments"
                    label="Export Documents"
                    severity="secondary"
                    @click="exportDocumentsModalOpen = true"
                >
                    <template #icon>
                        <Download />
                    </template>
                </Button>
                <Button
                    label="Import Documents"
                    @click="showImportDocumentsDrawerOpen = true"
                >
                    <template #icon>
                        <Plus />
                    </template>
                </Button>
            </div>
        </Teleport>

        <Teleport to="body">
            <div class="relative">
                <ImportDocumentsDrawer
                    v-model:visible="showImportDocumentsDrawerOpen"
                    :index-uid="indexUid"
                    :primary-key="currentIndex?.primaryKey"
                    @documents-imported="fetchData"
                />
                <ExportDocumentsModal
                    v-model:visible="exportDocumentsModalOpen"
                    :index-uid="indexUid"
                />
                <EditDocumentDrawer
                    v-model:visible="editDocumentDrawerOpen"
                    :index-uid="indexUid"
                    :primary-key="currentIndex?.primaryKey"
                    :document="currentDocument"
                    @document-updated="fetchData"
                />
                <FilterDocumentsDrawer
                    v-model:visible="showFilteringDrawerOpen"
                    v-model:filter="searchFilter"
                    v-model:geo-sort="searchGeoSort"
                    :index-uid="indexUid"
                    :filterable-attributes="filterableAttributes"
                    :sortable-attributes="sortableAttributes"
                    :searching="isSearching"
                    :enable-geo-filters="dataView === 'Geo'"
                    :total-hits="searchResults?.estimatedTotalHits"
                />
                <HybridSearchModal
                    v-if="availableEmbedders.length > 0"
                    v-model:visible="hybridSearchModalOpen"
                    v-model:hybridSearch="hybridSearchConfig"
                    :embedders="availableEmbedders"
                    @cancel="handleHybridSearchCancel"
                />
            </div>
        </Teleport>

        <Card>
            <template #content>
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="grow">
                        <IconField class="flex-1">
                            <InputIcon>
                                <Search />
                            </InputIcon>
                            <InputText
                                v-model="searchQuery"
                                placeholder="search query"
                                autofocus
                                fluid
                                @keyup.enter="searchPaginated(indexUid, true)"
                            />
                        </IconField>
                    </div>
                    <div>
                        <Chip
                            :label="totalHitsString"
                            class="text-muted-color-emphasis"
                        />
                    </div>
                    <div class="flex justify-end gap-4">
                        <div>
                            <Select
                                v-model="searchSort"
                                v-tooltip.top="{
                                    value: sortMessage,
                                    pt: {
                                        root: { class: 'max-w-[20rem] sm:max-w-[100%]' },
                                        text: { class: 'w-full' },
                                    },
                                }"
                                :options="sortingOptions"
                                :loading="isFetchingSettings.sortableAttributes"
                                showClear
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Sort by"
                                @change="searchPaginated(indexUid, true)"
                            />
                        </div>
                        <div class="relative">
                            <Button
                                v-tooltip.top="'Filter Documents'"
                                severity="secondary"
                                outlined
                                @click="showFilteringDrawerOpen = true"
                            >
                                <template #icon>
                                    <Funnel />
                                </template>
                            </Button>
                            <span
                                v-if="searchFilter || searchGeoSort"
                                class="absolute top-0 right-0 -mt-1 -mr-1 flex size-3"
                            >
                                <span class="relative inline-flex size-3 rounded-full bg-primary" />
                            </span>
                        </div>
                        <ToggleButton
                            v-if="availableEmbedders.length > 0"
                            v-model="hybridSearchEnabled"
                            v-tooltip.top="'Hybrid Search'"
                            onLabel=""
                            offLabel=""
                        >
                            <template #default>
                                <Astroid />
                            </template>
                        </ToggleButton>
                        <ToggleButton
                            v-model="showRankingScore"
                            v-tooltip.top="'Show Ranking Score'"
                            onLabel=""
                            offLabel=""
                            @change="searchPaginated(indexUid, true)"
                        >
                            <template #default>
                                <Trophy />
                            </template>
                        </ToggleButton>
                        <div>
                            <SelectButton
                                v-model="dataView"
                                :options="dataViewOptions"
                                :allowEmpty="false"
                            />
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Table view -->
        <Card v-show="dataView === 'Table'">
            <template #content>
                <Menu
                    ref="document-context-menu"
                    class="shadow-sm"
                    :model="documentContextMenuItems"
                    popup
                />
                <Popover
                    ref="field-detail-popover"
                    @hide="handleFieldPopoverHidden"
                >
                    <div class="w-auto max-w-[35rem]">
                        <ThemedJsonViewer
                            v-if="fieldDetail && Object.prototype.toString.call(fieldDetail) === '[object Object]'"
                            class="py-2 rounded-border max-h-[35rem] overflow-y-auto"
                            :data="fieldDetail"
                            expanded
                            :expandDepth="9999"
                        />
                        <pre
                            v-else
                            class="text-pretty"
                        >{{ fieldDetail }}</pre>
                    </div>
                </Popover>
                <DataTable
                    lazy
                    paginator
                    scrollable
                    :loading="isSearching"
                    :value="searchResults?.hits"
                    :rows="perPage"
                    :first="firstDatasetIndex"
                    :totalRecords="searchResults?.estimatedTotalHits"
                    :rowsPerPageOptions="[20, 50, 100]"
                    :pt="{
                        tableContainer: {
                            id: 'documents-data-table-container'
                        },
                        thead: {
                            class: 'z-2'
                        }
                    }"
                    scrollHeight="500px"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    @page="handlePageEvent($event, () => searchPaginated(indexUid), true, 'documents-data-table-container')"
                >
                    <template #empty>
                        <NotFoundMessage subject="Document" />
                    </template>
                    <Column
                        v-if="primaryKey"
                        :pt="{
                            headerCell: {
                                class: 'dynamic-bg z-2'
                            },
                            bodyCell: {
                                class: 'dynamic-bg z-1'
                            }
                        }"
                        :header="primaryKey"
                        :field="primaryKey"
                        frozen
                        alignFrozen="left"
                    />
                    <Column
                        v-if="showRankingScore"
                        :pt="{
                            headerCell: {
                                class: 'dynamic-bg z-2'
                            },
                            bodyCell: {
                                class: 'dynamic-bg z-1'
                            }
                        }"
                        header="Ranking Score"
                        frozen
                        alignFrozen="left"
                    >
                        <template #body="{ data }">
                            <Tag
                                v-if="data._rankingScore !== undefined"
                                :value="`${Math.round(data._rankingScore * 100)}%`"
                                :severity="getRankingScoreSeverity(data._rankingScore)"
                            />
                        </template>
                    </Column>
                    <Column
                        v-if="showRankingScore"
                        :pt="{
                            headerCell: {
                                class: 'dynamic-bg z-2'
                            },
                            bodyCell: {
                                class: 'dynamic-bg z-1'
                            }
                        }"
                        header="Ranking Score Details"
                        frozen
                        alignFrozen="left"
                    >
                        <template #body="{ data }">
                            <Button
                                v-if="data._rankingScoreDetails !== undefined"
                                v-tooltip.top="'View Ranking Score Details'"
                                class="p-0 text-inherit"
                                severity="contrast"
                                variant="link"
                                @click="toggleTableFieldDetailPopover($event, '_rankingScoreDetails', data._rankingScoreDetails)"
                            >
                                View Details
                            </Button>
                        </template>
                    </Column>
                    <Column
                        v-for="fieldName in Object.keys(indexStats?.fieldDistribution ?? {})"
                        :key="fieldName"
                        :field="fieldName"
                        :header="fieldName"
                    >
                        <template #body="{ data }">
                            <Image
                                v-if="looksLikeAnImageUrl(data[fieldName])"
                                :src="data[fieldName]"
                                alt="Document Image"
                                pt:previewMask:class="rounded-xl"
                                pt:image:class="max-h-20 rounded-border"
                                preview
                            />
                            <Button
                                v-else
                                v-tooltip.top="{
                                    value: `View ${fieldName} value`,
                                    pt: {
                                        root: { class: 'max-w-[20rem] sm:max-w-[100%]' },
                                        text: { class: 'w-full' },
                                    },
                                }"
                                class="p-0 text-inherit"
                                severity="contrast"
                                variant="link"
                                @click="toggleTableFieldDetailPopover($event, fieldName, data[fieldName])"
                            >
                                <span class="truncate w-auto max-w-[200px]">{{ data[fieldName] }}</span>
                            </Button>
                        </template>
                    </Column>
                    <Column
                        frozen
                        alignFrozen="right"
                    >
                        <template #body="{ data }">
                            <Button
                                v-tooltip.top="'Show Document Actions'"
                                type="button"
                                severity="secondary"
                                rounded
                                text
                                @click="toggleDocumentContextMenu($event, data)"
                            >
                                <template #icon>
                                    <EllipsisVertical class="size-5!" />
                                </template>
                            </Button>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Geo View -->
        <div v-show="dataView === 'Geo'">
            <Card>
                <template #content>
                    <div v-if="!searchResults?.hits.length && isSearching">
                        <div class="h-full flex flex-col items-center justify-center p-8 gap-4">
                            <ProgressSpinner
                                pt:root:class="h-15"
                                strokeWidth="4"
                                animationDuration=".5s"
                            />
                            <div class="text-sm text-muted-color">
                                Loading Documents...
                            </div>
                        </div>
                    </div>
                    <div v-else-if="searchResults?.hits.length">
                        <ClientOnly>
                            <DocumentsGeoMap
                                :hits="searchResults.hits"
                                :primary-key="primaryKey"
                            />
                        </ClientOnly>
                    </div>
                    <div v-else>
                        <NotFoundMessage subject="Document" />
                    </div>
                </template>
            </Card>

            <div
                v-if="searchResults?.hits.length"
                class="mt-4"
            >
                <Paginator
                    :rows="perPage"
                    :first="firstDatasetIndex"
                    :totalRecords="searchResults?.estimatedTotalHits"
                    :rowsPerPageOptions="[20, 50, 100]"
                    pt:root:class="shadow-sm border dynamic-border rounded-xl"
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    @page="handlePageEvent($event, () => searchPaginated(indexUid), false)"
                />
            </div>
        </div>

        <!-- JSON View -->
        <div
            v-show="dataView === 'JSON'"
            class="relative"
        >
            <div class="space-y-4">
                <div v-if="!searchResults?.hits.length && isSearching">
                    <div class="h-full flex flex-col items-center justify-center p-8 gap-4">
                        <ProgressSpinner
                            pt:root:class="h-15"
                            strokeWidth="4"
                            animationDuration=".5s"
                        />
                        <div class="text-sm text-muted-color">
                            Loading Documents...
                        </div>
                    </div>
                </div>
                <div
                    v-else-if="searchResults?.hits.length"
                    class="grid grid-cols-1 sm:grid-cols-12 gap-4"
                >
                    <!-- When using card -->
                    <!-- sm:col-span-6 lg:col-span-3 -->
                    <div
                        v-for="hit, hitIndex in searchResults.hits"
                        :key="(primaryKey && hit[primaryKey]) ?? hitIndex"
                        class="col-span-12"
                    >
                        <DocumentHitJsonRow
                            :hit
                            :primary-key="primaryKey"
                            :show-ranking-score="showRankingScore"
                            @edit="editDocument"
                            @delete="handleDeleteDocument"
                        />
                    </div>
                </div>
                <div v-else-if="!searchResults?.hits.length && !isSearching">
                    <NotFoundMessage subject="Document" />
                </div>
                <div v-if="searchResults?.hits.length">
                    <Paginator
                        :rows="perPage"
                        :first="firstDatasetIndex"
                        :totalRecords="searchResults?.estimatedTotalHits"
                        :rowsPerPageOptions="[20, 50, 100]"
                        pt:root:class="shadow-sm border dynamic-border rounded-xl"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                        @page="handlePageEvent($event, () => searchPaginated(indexUid))"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
