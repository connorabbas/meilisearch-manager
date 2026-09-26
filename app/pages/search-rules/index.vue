<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { SearchRule } from 'meilisearch'
import { useDebounceFn } from '@vueuse/core'
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import { isVersionAtLeast } from '@/utils'

definePageMeta({
    layout: 'app',
    title: 'Search Rules',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Search Rules' }],
})

const UButton = resolveComponent('UButton')

const {
    currentPage,
    perPage,
    rules,
    rulesResults,
    isFetching,
    error,
    searchQuery,
    activeFilter,
    fetchRulesPaginated,
    paginate,
    confirmDeleteRule,
} = useDynamicSearchRules()

const { features, fetchExperimentalFeatures } = useExperimentalFeatures()
const { version, fetchVersion } = useStats()

await Promise.all([
    fetchExperimentalFeatures(),
    fetchVersion(),
])

const isSupportedVersion = computed(() => {
    return !!version.value && isVersionAtLeast(version.value.pkgVersion, '1.41.0')
})
const isFeatureEnabled = computed(() => features.value?.dynamicSearchRules === true)
const isFeatureAvailable = computed(() => isSupportedVersion.value && isFeatureEnabled.value)

if (isFeatureAvailable.value) {
    await fetchRulesPaginated()
}

const activeFilterItems = [
    { label: 'Any', value: null },
    { label: 'Active', value: true, color: 'success' as const },
    { label: 'Inactive', value: false, color: 'warning' as const },
]
const activeFilterCount = computed(() => activeFilter.value === null ? 0 : 1)
const sorting = ref<Array<{ id: string, desc: boolean }>>([])

const columns: TableColumn<SearchRule>[] = [
    {
        accessorKey: 'uid',
        header: 'UID',
    },
    {
        accessorKey: 'description',
        header: 'Description',
    },
    {
        accessorKey: 'precedence',
        enableSorting: true,
        header: ({ column }) => {
            const sorted = column.getIsSorted()

            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                label: 'Priority',
                'aria-label': sorted === 'asc'
                    ? 'Priority, sorted ascending'
                    : sorted === 'desc'
                        ? 'Priority, sorted descending'
                        : 'Priority, not sorted',
                icon: sorted
                    ? sorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                class: '-mx-2.5',
                onClick: () => {
                    if (sorted === 'desc') {
                        column.clearSorting()
                    } else {
                        column.toggleSorting(sorted === 'asc')
                    }
                },
            })
        },
    },
    {
        id: 'status',
        header: 'Status',
    },
    {
        id: 'conditions',
        header: 'Conditions',
    },
    {
        id: 'ruleActions',
        header: 'Actions',
    },
    {
        id: 'actions',
        header: '',
        size: 48,
        meta: { class: { th: 'text-end', td: 'text-end' } },
    },
]

const summary = computed(() => {
    const total = rulesResults.value?.total ?? 0
    const first = total ? ((currentPage.value - 1) * perPage.value) + 1 : 0

    return `Showing ${first} to ${Math.min(currentPage.value * perPage.value, total)} of ${total} rules`
})

const debouncedSearch = useDebounceFn(() => {
    void fetchRulesPaginated(true)
}, 300)

watch(searchQuery, debouncedSearch)
watch(activeFilter, () => {
    void fetchRulesPaginated(true)
})

function clearFilters() {
    activeFilter.value = null
}

function ruleActions(rule: SearchRule) {
    return [
        {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            onSelect: () => navigateTo(`/search-rules/${encodeURIComponent(rule.uid)}/edit`),
        },
        {
            label: 'Delete',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => confirmDeleteRule(rule.uid, () => {
                void fetchRulesPaginated()
            }),
        },
    ]
}

async function changePage(page: number) {
    await paginate(page, perPage.value, fetchRulesPaginated)
}

async function changePageSize(size: number) {
    await paginate(currentPage.value, size, fetchRulesPaginated)
}
</script>

<template>
    <AppDashboardPanel id="search-rules">
        <template #actions>
            <AppPageActions>
                <UButton
                    v-if="isFeatureAvailable"
                    aria-label="Refresh"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="ghost"
                    :loading="isFetching"
                    @click="fetchRulesPaginated()"
                />
                <UButton
                    v-if="isFeatureAvailable"
                    to="/search-rules/create"
                    label="New Rule"
                    icon="i-lucide-plus"
                />
            </AppPageActions>
        </template>

        <SearchRulesFeatureUnavailableCard
            v-if="!isFeatureAvailable"
            :is-supported-version="isSupportedVersion"
            :version="version?.pkgVersion ?? null"
            :is-feature-enabled="isFeatureEnabled"
            feature-name="Dynamic Search Rules"
        />

        <template v-else>
            <UAlert
                v-if="error"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-x"
                title="Unable to load search rules"
                :description="error"
                :actions="[{ label: 'Retry', onClick: () => fetchRulesPaginated() }]"
            />

            <UCard
                variant="outline"
                :ui="{
                    header: 'shrink-0 p-4 py-3 sm:px-6',
                    body: 'p-0 sm:p-0',
                }"
            >
                <template #header>
                    <div class="flex flex-wrap items-center gap-2">
                        <UInput
                            v-model="searchQuery"
                            aria-label="Search rules by UID"
                            icon="i-lucide-search"
                            placeholder="Search by UID..."
                            class="w-full sm:max-w-xs"
                        />

                        <AppFiltersPopover
                            :count="activeFilterCount"
                            @clear="clearFilters"
                        >
                            <UFormField label="Status">
                                <USelect
                                    v-model="activeFilter"
                                    :items="activeFilterItems"
                                    value-key="value"
                                    label-key="label"
                                    aria-label="Filter search rules by status"
                                    placeholder="Any"
                                    class="w-full"
                                >
                                    <template #item-label="{ item }">
                                        <UBadge
                                            v-if="item.value !== null"
                                            :color="item.color"
                                            variant="subtle"
                                            :label="item.label"
                                        />
                                        <span v-else>{{ item.label }}</span>
                                    </template>
                                </USelect>
                            </UFormField>
                        </AppFiltersPopover>
                    </div>
                </template>

                <UTable
                    v-model:sorting="sorting"
                    :data="rules"
                    :columns="columns"
                    :get-row-id="row => row.uid"
                    :loading="isFetching"
                >
                    <template #description-cell="{ row }">
                        <UTooltip
                            v-if="row.original.description"
                            :text="row.original.description"
                        >
                            <span class="block max-w-72 truncate">
                                {{ row.original.description }}
                            </span>
                        </UTooltip>
                    </template>

                    <template #precedence-cell="{ row }">
                        {{ row.original.precedence ?? '' }}
                    </template>

                    <template #status-cell="{ row }">
                        <UBadge
                            :label="row.original.active ? 'Active' : 'Inactive'"
                            :color="row.original.active ? 'success' : 'warning'"
                            variant="subtle"
                        />
                    </template>

                    <template #conditions-cell="{ row }">
                        {{ Object.values(row.original.conditions ?? {}).filter(Boolean).length }}
                    </template>

                    <template #ruleActions-cell="{ row }">
                        {{ row.original.actions?.length ?? 0 }}
                    </template>

                    <template #actions-cell="{ row }">
                        <div class="flex justify-end">
                            <UDropdownMenu :items="ruleActions(row.original)">
                                <UButton
                                    aria-label="Show search rule actions"
                                    icon="i-lucide-ellipsis-vertical"
                                    color="neutral"
                                    variant="ghost"
                                    square
                                />
                            </UDropdownMenu>
                        </div>
                    </template>

                    <template #loading>
                        <div class="flex justify-center py-4">
                            <USkeleton class="h-5 w-48" />
                        </div>
                    </template>

                    <template #empty>
                        <UEmpty
                            variant="naked"
                            icon="i-lucide-list-x"
                            title="No rules found"
                        />
                    </template>
                </UTable>

                <template #footer>
                    <AppPagination
                        :page="currentPage"
                        :per-page="perPage"
                        :total="rulesResults?.total ?? 0"
                        :summary="summary"
                        :disabled="isFetching"
                        show-edges
                        @page="changePage"
                        @per-page="changePageSize"
                    />
                </template>
            </UCard>
        </template>
    </AppDashboardPanel>
</template>
