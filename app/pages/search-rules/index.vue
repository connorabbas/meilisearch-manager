<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import Menu from '@/components/router-link-menus/Menu.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { isVersionAtLeast } from '@/utils'
import { Plus, Pencil, Trash2, EllipsisVertical, Search } from '@lucide/vue'
import { useDebounceFn } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import type { SearchRule } from 'meilisearch'
import type { MenuItem } from '@/types'
import type { DataTableSortEvent } from 'primevue/datatable'

definePageMeta({
    layout: 'app',
    title: 'Search Rules',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Search Rules' }]
})

const toast = useToast()

const {
    perPage,
    firstDatasetIndex,
    rules,
    rulesResults,
    isFetching: isFetchingRules,
    searchQuery,
    activeFilter,
    fetchRulesPaginated,
    handlePageEvent,
    confirmDeleteRule,
} = useDynamicSearchRules()

const {
    features,
    fetchExperimentalFeatures,
} = useExperimentalFeatures()

const {
    version,
    fetchVersion,
} = useStats()

const isSupportedVersion = computed(() => {
    return version.value ? isVersionAtLeast(version.value.pkgVersion, '1.41.0') : false
})

const isFeatureEnabled = computed(() => {
    return features.value?.dynamicSearchRules === true
})

const isFeatureAvailable = computed(() => isSupportedVersion.value && isFeatureEnabled.value)

await Promise.all([
    fetchExperimentalFeatures(),
    fetchVersion(),
])

if (isFeatureAvailable.value) {
    await fetchRulesPaginated()
}

function editRule(rule: SearchRule) {
    navigateTo(`/search-rules/${rule.uid}/edit`)
}

const activeFilterOptions = [
    { label: 'Active', value: true, severity: 'success' },
    { label: 'Inactive', value: false, severity: 'warn' },
]

const debouncedSearch = useDebounceFn(() => {
    fetchRulesPaginated(true)
}, 300)

watch(searchQuery, () => {
    debouncedSearch()
})

watch(activeFilter, () => {
    fetchRulesPaginated(true)
})

function onSort(event: DataTableSortEvent) {
    const { sortField, sortOrder } = event
    if (sortField !== 'priority' || sortOrder === null || sortOrder === undefined) return

    rules.value.sort((a, b) => {
        const aVal = a.priority ?? Number.MAX_SAFE_INTEGER
        const bVal = b.priority ?? Number.MAX_SAFE_INTEGER
        return (aVal - bVal) * sortOrder
    })
}

const contextMenu = useTemplateRef('rule-context-menu')
const contextMenuItems = ref<MenuItem[]>([])
function toggleContextMenu(event: Event, rule: SearchRule) {
    contextMenuItems.value = [
        {
            label: 'Edit',
            lucideIcon: Pencil,
            command: () => editRule(rule),
        },
        {
            label: 'Delete',
            lucideIcon: Trash2,
            class: 'delete-menu-item',
            lucideIconClass: 'text-red-500 dark:text-red-400',
            command: () => {
                confirmDeleteRule(rule.uid, () => {
                    toast.add({
                        severity: 'success',
                        summary: 'Rule Deleted',
                        detail: `Search rule "${rule.uid}" was deleted`,
                        life: 3000,
                    })
                    fetchRulesPaginated()
                })
            },
        },
    ]
    contextMenu.value?.toggle(event)
}
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <PageTitleSection>
            <template #title>
                Search Rules
            </template>
            <template #subTitle>
                <span
                    v-if="!isFeatureAvailable"
                    class="text-muted-color"
                >
                    Feature availability depends on Meilisearch version and experimental flags.
                </span>
            </template>
            <template #end>
                <NuxtLink
                    v-if="isFeatureAvailable"
                    to="/search-rules/create"
                >
                    <Button label="New Rule">
                        <template #icon>
                            <Plus />
                        </template>
                    </Button>
                </NuxtLink>
            </template>
        </PageTitleSection>

        <SearchRulesFeatureUnavailableCard
            v-if="!isFeatureAvailable"
            :is-supported-version="isSupportedVersion"
            :version="version?.pkgVersion ?? null"
            :is-feature-enabled="isFeatureEnabled"
            feature-name="Dynamic Search Rules"
        />

        <Card v-else>
            <template #content>
                <Menu
                    ref="rule-context-menu"
                    class="shadow-sm"
                    :model="contextMenuItems"
                    popup
                />
                <DataTable
                    lazy
                    paginator
                    removable-sort
                    :value="rules"
                    :loading="isFetchingRules"
                    :rows="perPage"
                    :first="firstDatasetIndex"
                    :totalRecords="rulesResults?.total"
                    :rowsPerPageOptions="[20, 50, 100]"
                    filter-display="row"
                    :pt="{
                        tableContainer: {
                            id: 'search-rules-data-table-container'
                        },
                        thead: {
                            class: 'z-2'
                        }
                    }"
                    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    current-page-report-template="Showing {first} to {last} of {totalRecords} records"
                    scrollable
                    column-resize-mode="fit"
                    @page="handlePageEvent($event, () => fetchRulesPaginated())"
                    @sort="onSort"
                >
                    <template #empty>
                        <NotFoundMessage subject="Rule" />
                    </template>
                    <Column
                        field="uid"
                        header="UID"
                        :show-filter-menu="false"
                    >
                        <template #filter>
                            <IconField>
                                <InputIcon>
                                    <Search class="size-4" />
                                </InputIcon>
                                <InputText
                                    v-model="searchQuery"
                                    placeholder="Search by uid..."
                                    fluid
                                />
                            </IconField>
                        </template>
                    </Column>
                    <Column
                        field="description"
                        header="Description"
                    >
                        <template #body="{ data }">
                            <span
                                v-if="(data as SearchRule).description"
                                class="truncate inline-block max-w-[300px]"
                            >
                                {{ (data as SearchRule).description }}
                            </span>
                        </template>
                    </Column>
                    <Column
                        field="priority"
                        header="Priority"
                        sortable
                    >
                        <template #body="{ data }">
                            {{ (data as SearchRule).priority ?? '' }}
                        </template>
                    </Column>
                    <Column
                        field="active"
                        header="Status"
                        :show-filter-menu="false"
                    >
                        <template #filter>
                            <Select
                                v-model="activeFilter"
                                :options="activeFilterOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="Any"
                                show-clear
                                fluid
                            >
                                <template #value="{ value, placeholder }">
                                    <Tag
                                        v-if="value !== null && value !== undefined"
                                        :value="value ? 'Active' : 'Inactive'"
                                        :severity="value ? 'success' : 'warn'"
                                    />
                                    <span v-else>{{ placeholder }}</span>
                                </template>
                                <template #option="{ option }">
                                    <Tag
                                        :value="option.label"
                                        :severity="option.severity"
                                    />
                                </template>
                            </Select>
                        </template>
                        <template #body="{ data }">
                            <Tag
                                :value="(data as SearchRule).active ? 'Active' : 'Inactive'"
                                :severity="(data as SearchRule).active ? 'success' : 'warn'"
                            />
                        </template>
                    </Column>
                    <Column
                        field="conditions"
                        header="Conditions"
                    >
                        <template #body="{ data }">
                            {{ (data as SearchRule).conditions?.length ?? 0 }}
                        </template>
                    </Column>
                    <Column
                        field="actions"
                        header="Actions"
                    >
                        <template #body="{ data }">
                            {{ (data as SearchRule).actions?.length ?? 0 }}
                        </template>
                    </Column>
                    <Column
                        frozen
                        align-frozen="right"
                    >
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <Button
                                    v-tooltip.top="'Show Search Rule Actions'"
                                    type="button"
                                    severity="secondary"
                                    rounded
                                    text
                                    @click="toggleContextMenu($event, data as SearchRule)"
                                >
                                    <template #icon>
                                        <EllipsisVertical class="size-5!" />
                                    </template>
                                </Button>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>
    </div>
</template>
