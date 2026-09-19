<script setup lang="ts">
import { useStats } from '@/composables/meilisearch/useStats'
import { ArrowRight, Plus } from '@lucide/vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import CreateIndexModal from '@/components/meilisearch/CreateIndexModal.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import { formatNumber, formatDate } from '@/utils'

definePageMeta({
    layout: 'app',
    title: 'Indexes',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Indexes' }]
})

const { instanceStats, isFetching: isFetchingStats, fetchStats } = useStats()
const {
    perPage,
    firstDatasetIndex,
    indexes,
    indexesResults,
    isFetching: isFetchingIndexes,
    fetchIndexesPaginated,
    handlePageEvent,
} = useIndexes()

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchIndexesPaginated()
    ])
}
await fetchData()

const createIndexModalOpen = ref(false)

const indexesData = computed(() => {
    return indexes.value.map((index) => {
        return {
            ...index,
            numberOfDocuments: instanceStats.value?.indexes[index.uid]?.numberOfDocuments ?? 0,
        }
    })
})
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <CreateIndexModal
            v-model:visible="createIndexModalOpen"
            @index-created="fetchData"
        />

        <PageTitleSection>
            <template #title>
                Indexes
            </template>
            <template #end>
                <div class="flex gap-4">
                    <RefreshButton
                        :loading="isFetchingIndexes || isFetchingStats"
                        @click="fetchData"
                    />
                    <Button
                        label="New Index"
                        @click="createIndexModalOpen = true"
                    >
                        <template #icon>
                            <Plus />
                        </template>
                    </Button>
                </div>
            </template>
        </PageTitleSection>

        <div>
            <Card>
                <template #content>
                    <DataTable
                        lazy
                        paginator
                        scrollable
                        :loading="isFetchingIndexes"
                        :value="indexesData"
                        :rows="perPage"
                        :first="firstDatasetIndex"
                        :totalRecords="indexesResults?.total"
                        :rowsPerPageOptions="[20, 50, 100]"
                        :pt="{
                            tableContainer: {
                                id: 'indexes-data-table-container'
                            },
                            thead: {
                                class: 'z-2'
                            }
                        }"
                        scrollHeight="500px"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                        @page="handlePageEvent($event, () => fetchIndexesPaginated(), true, 'indexes-data-table-container')"
                    >
                        <template #empty>
                            <NotFoundMessage subject="Index" />
                        </template>
                        <Column
                            field="uid"
                            header="UID"
                        />
                        <Column
                            field="primaryKey"
                            header="Primary Key"
                        >
                            <template #body="{ data }">
                                <Tag
                                    v-if="data.primaryKey"
                                    :value="data.primaryKey"
                                    severity="info"
                                />
                                <Tag
                                    v-else
                                    value="Not Set"
                                    severity="secondary"
                                />
                            </template>
                        </Column>
                        <Column
                            field="numberOfDocuments"
                            header="Documents"
                        >
                            <template #body="{ data }">
                                {{ formatNumber(data.numberOfDocuments) }}
                            </template>
                        </Column>
                        <Column
                            field="createdAt"
                            header="Created"
                        >
                            <template #body="{ data }">
                                {{ formatDate(data.createdAt) }}
                            </template>
                        </Column>
                        <Column
                            field="updatedAt"
                            header="Updated"
                        >
                            <template #body="{ data }">
                                {{ formatDate(data.updatedAt) }}
                            </template>
                        </Column>
                        <Column
                            frozen
                            alignFrozen="right"
                        >
                            <template #body="{ data }">
                                <Button
                                    v-slot="slotProps"
                                    asChild
                                    outlined
                                >
                                    <NuxtLink
                                        :to="`/indexes/${data.uid}`"
                                        :class="[slotProps.class, 'no-underline']"
                                    >
                                        View
                                        <ArrowRight />
                                    </NuxtLink>
                                </Button>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>
