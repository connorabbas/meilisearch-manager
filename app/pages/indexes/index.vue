<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { IndexObject } from 'meilisearch'
import { useStats } from '@/composables/meilisearch/useStats'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import CreateIndexModal from '@/components/meilisearch/CreateIndexModal.vue'
import { formatNumber, formatDate } from '@/utils'

definePageMeta({
    layout: 'app',
    title: 'Indexes',
    dashboardPanel: true,
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Indexes' }]
})

const { instanceStats, isFetching: isFetchingStats, fetchStats } = useStats()
const {
    currentPage,
    perPage,
    indexes,
    totalIndexes,
    paginationSummary,
    isFetching: isFetchingIndexes,
    error,
    fetchIndexesPaginated,
    paginate,
} = useIndexes()

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchIndexesPaginated()
    ])
}
await fetchData()

const createIndexModalOpen = ref(false)
const columnPinning = ref({ right: ['actions'] })

type IndexRow = IndexObject & {
    numberOfDocuments: number;
}

const indexesData = computed<IndexRow[]>(() => {
    return indexes.value.map((index) => {
        return {
            ...index,
            numberOfDocuments: instanceStats.value?.indexes[index.uid]?.numberOfDocuments ?? 0,
        }
    })
})

const columns: TableColumn<IndexRow>[] = [
    { accessorKey: 'uid', header: 'UID' },
    { accessorKey: 'primaryKey', header: 'Primary Key' },
    {
        accessorKey: 'numberOfDocuments',
        header: 'Documents',
        meta: { class: { th: 'text-end', td: 'text-end' } },
    },
    { accessorKey: 'createdAt', header: 'Created' },
    { accessorKey: 'updatedAt', header: 'Updated' },
    {
        id: 'actions',
        enableHiding: false,
        size: 112,
        minSize: 112,
        maxSize: 112,
        meta: { class: { th: 'text-end', td: 'text-end' } },
    },
]

async function changePage(page: number) {
    await paginate(page, perPage.value, fetchIndexesPaginated)
}

async function changePageSize(pageSize: number) {
    await paginate(currentPage.value, pageSize, fetchIndexesPaginated)
}
</script>

<template>
    <AppDashboardPanel id="indexes">
        <CreateIndexModal
            v-model:open="createIndexModalOpen"
            @index-created="fetchData"
        />

        <template #actions>
            <AppPageActions>
                <UButton
                    label="Refresh"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="outline"
                    :loading="isFetchingIndexes || isFetchingStats"
                    @click="fetchData"
                />
                <UButton
                    label="New Index"
                    icon="i-lucide-plus"
                    @click="createIndexModalOpen = true"
                />
            </AppPageActions>
        </template>

        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load indexes"
            :description="error"
            :actions="[{ label: 'Retry', onClick: fetchData }]"
        />

        <UCard
            :ui="{ body: 'p-0 sm:p-0' }"
            variant="outline"
            class="shrink-0"
        >
            <UTable
                v-model:column-pinning="columnPinning"
                :data="indexesData"
                :columns="columns"
                :get-row-id="row => row.uid"
                :loading="isFetchingIndexes"
            >
                <template #primaryKey-cell="{ row }">
                    <UBadge
                        v-if="row.original.primaryKey"
                        color="info"
                        variant="subtle"
                        :label="row.original.primaryKey"
                    />
                    <UBadge
                        v-else
                        color="neutral"
                        variant="subtle"
                        label="Not set"
                    />
                </template>

                <template #numberOfDocuments-cell="{ row }">
                    {{ formatNumber(row.original.numberOfDocuments) }}
                </template>

                <template #createdAt-cell="{ row }">
                    {{ formatDate(row.original.createdAt) }}
                </template>

                <template #updatedAt-cell="{ row }">
                    {{ formatDate(row.original.updatedAt) }}
                </template>

                <template #actions-cell="{ row }">
                    <UButton
                        :to="`/indexes/${encodeURIComponent(row.original.uid)}`"
                        label="View"
                        trailing-icon="i-lucide-arrow-right"
                        color="neutral"
                        variant="ghost"
                    />
                </template>

                <template #loading>
                    <div class="flex justify-center py-4">
                        <USkeleton class="h-5 w-48" />
                    </div>
                </template>

                <template #empty>
                    <UEmpty
                        variant="naked"
                        icon="i-lucide-database"
                        title="No indexes found"
                    />
                </template>
            </UTable>

            <template #footer>
                <AppTablePagination
                    :page="currentPage"
                    :per-page="perPage"
                    :total="totalIndexes"
                    :summary="paginationSummary"
                    :disabled="isFetchingIndexes"
                    show-edges
                    @page="changePage"
                    @per-page="changePageSize"
                />
            </template>
        </UCard>
    </AppDashboardPanel>
</template>
