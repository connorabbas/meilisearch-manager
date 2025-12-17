<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useSearch } from '@/composables/meilisearch/useSearch'
import type { Index, RecordAny } from 'meilisearch'
//import DocumentHitCard from '@/components/meilisearch/DocumentHitCard.vue';
import DocumentHitJsonRow from '@/components/meilisearch/DocumentHitJsonRow.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import Menu from '@/components/router-link-menus/Menu.vue'
import { useStats } from '@/composables/meilisearch/useStats'
import { looksLikeAnImageUrl } from '@/utils'
import { EllipsisVertical, Funnel, Pencil, Plus, Search, Trash2, X } from 'lucide-vue-next'
import type { MenuItem } from '@/types'
import ImportDocumentsDrawer from '@/components/meilisearch/ImportDocumentsDrawer.vue'
import EditDocumentDrawer from '@/components/meilisearch/EditDocumentDrawer.vue'
import FilterDocumentsDrawer from '@/components/meilisearch/FilterDocumentsDrawer.vue'
import ThemedJsonViewer from '@/components/ThemedJsonViewer.vue'
import { useDocuments } from '@/composables/meilisearch/useDocuments'
import { useSettings } from '@/composables/meilisearch/useSettings'

const props = defineProps<{
    indexUid: string,
    index: Index,
}>()

const primaryKey = computed(() => props.index?.primaryKey)

const { isSendingTask, confirmDeleteDocument } = useDocuments()
const { indexStats, fetchIndexStats } = useStats()
const {
    sortableAttributes,
    filterableAttributes,
    isFetching: isFetchingSettings,
    fetchSortableAttributes,
    fetchFilterableAttributes,
} = useSettings()
const {
    perPage,
    firstDatasetIndex,
    searchResults,
    searchQuery,
    searchSort,
    searchFilter,
    isFetching: isSearching,
    searchPaginated,
    handlePageEvent,
} = useSearch()

// Add delay to blocked UI, because the meiliclient is too fast...
// https://github.com/primefaces/primevue/issues/7817
const blockedJsonView = ref(false)
watch(isSearching, (newVal) => {
    nextTick(() => {
        if (!newVal) {
            setTimeout(() => {
                blockedJsonView.value = newVal
            }, 50)
        } else {
            blockedJsonView.value = newVal
        }
    })
})

async function fetchData() {
    await Promise.all([
        searchPaginated(props.indexUid, true),
        fetchIndexStats(props.indexUid),
    ])
}
await fetchData()

const dataView = ref<'JSON' | 'Table'>('JSON')

function handleClearSearchQuery() {
    searchQuery.value = ''
    searchPaginated(props.indexUid, true)
}
function handleDeleteDocument(documentId: string | number) {
    confirmDeleteDocument(props.indexUid, documentId, () => {
        fetchData()
    })
}

// Sorting
type SortOptions = {
    value: string[],
    label: string,
}
const sortMessage = computed(() => {
    if (sortableAttributes.value?.length) {
        return 'Sort Documents'
    }
    return 'No sortable attributes available, please update the index settings'
})
// Basic single sort, TODO: use Multiselect for multi-sort?
const sortingOptions = computed(() => {
    const options: SortOptions[] = []
    sortableAttributes.value?.forEach((attribute) => {
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

// Create Drawer
const showImportDocumentsDrawerOpen = ref(false)

// Edit / Details Drawer
const editDocumentDrawerOpen = ref(false)
const currentDocument = ref<RecordAny | null>()
function editDocument(document: RecordAny) {
    currentDocument.value = document
    editDocumentDrawerOpen.value = true
}
function handleEditDrawerHidden() {
    if (!isSendingTask.value) {
        // delayed null reset to allow the drawer close animation to complete
        setTimeout(() => {
            currentDocument.value = null
        }, 250)
    }
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

watch(searchFilter, () => {
    searchPaginated(props.indexUid, true)
})

onMounted(async () => {
    await Promise.all([
        fetchSortableAttributes(props.indexUid),
        fetchFilterableAttributes(props.indexUid),
    ])
})
</script>

<template>
    <div>
        <Teleport to="#index-page-actions">
            <Button
                label="Import Documents"
                @click="showImportDocumentsDrawerOpen = true"
            >
                <template #icon>
                    <Plus />
                </template>
            </Button>
        </Teleport>
        <div class="space-y-4">
            <div class="relative">
                <ImportDocumentsDrawer
                    v-model="showImportDocumentsDrawerOpen"
                    :index-uid="props.indexUid"
                    :primary-key="props.index?.primaryKey"
                    @documents-imported="fetchData"
                />
                <EditDocumentDrawer
                    v-model="editDocumentDrawerOpen"
                    :index-uid="props.indexUid"
                    :primary-key="props.index?.primaryKey"
                    :document="currentDocument"
                    @document-updated="fetchData"
                    @hide="handleEditDrawerHidden"
                />
                <FilterDocumentsDrawer
                    v-model="showFilteringDrawerOpen"
                    v-model:filter="searchFilter"
                    :index-uid="props.indexUid"
                    :filterable-attributes="filterableAttributes"
                    :searching="isSearching"
                    :total-hits="searchResults?.estimatedTotalHits"
                />
            </div>
            <Card>
                <template #content>
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="grow">
                            <InputGroup>
                                <!-- TODO: debounced @input search -->
                                <InputText
                                    v-model="searchQuery"
                                    placeholder="search query"
                                    autofocus
                                    @keyup.enter="searchPaginated(props.indexUid, true)"
                                />
                                <Button
                                    v-if="searchQuery"
                                    v-tooltip="'Clear search query'"
                                    severity="secondary"
                                    outlined
                                    @click="handleClearSearchQuery"
                                >
                                    <template #icon>
                                        <X />
                                    </template>
                                </Button>
                                <Button
                                    severity="secondary"
                                    outlined
                                    @click="searchPaginated(props.indexUid, true)"
                                >
                                    <template #icon>
                                        <Search />
                                    </template>
                                </Button>
                            </InputGroup>
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
                                    @change="searchPaginated(props.indexUid, true)"
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
                                    v-if="searchFilter"
                                    class="absolute top-0 right-0 -mt-1 -mr-1 flex size-3"
                                >
                                    <span class="relative inline-flex size-3 rounded-full bg-primary" />
                                </span>
                            </div>
                            <div>
                                <SelectButton
                                    v-model="dataView"
                                    :options="['JSON', 'Table']"
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
                                class="py-2 rounded-lg max-h-[35rem] overflow-y-auto"
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
                        @page="handlePageEvent($event, () => searchPaginated(props.indexUid), true, 'documents-data-table-container')"
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
                                    pt:image:class="max-h-20 rounded-lg"
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
                            header="Action"
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
            <!-- Grid View -->
            <div
                v-show="dataView === 'JSON'"
                class="relative"
            >
                <BlockUI
                    :blocked="blockedJsonView"
                    pt:mask:class="z-1!"
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
                                @page="handlePageEvent($event, () => searchPaginated(props.indexUid))"
                            />
                        </div>
                    </div>
                </BlockUI>
            </div>
        </div>
    </div>
</template>
