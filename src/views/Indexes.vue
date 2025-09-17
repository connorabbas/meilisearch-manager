<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStats } from '@/composables/meilisearch/useStats';
import { ArrowRight, Home, Plus, RefreshCw } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import CreateIndexDrawer from '@/components/meilisearch/CreateIndexDrawer.vue';
import NotFoundMessage from '@/components/NotFoundMessage.vue';

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Indexes' }];

const { instanceStats, isFetching: isFetchingStats, fetchStats } = useStats();
const {
    perPage,
    firstDatasetIndex,
    indexes,
    indexesResults,
    isFetching: isFetchingIndexes,
    fetchIndexesPaginated,
    handlePageEvent,
} = useIndexes();

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchIndexesPaginated(),
    ]);
}
await fetchData();

const createIndexDrawerOpen = ref(false);

const indexesData = computed(() => {
    return indexes.value.map((index) => {
        return {
            ...index,
            numberOfDocuments: instanceStats.value?.indexes[index.uid]?.numberOfDocuments ?? 0,
        };
    });
});
</script>

<template>
    <AppLayout :breadcrumbs>
        <CreateIndexDrawer
            v-model="createIndexDrawerOpen"
            @index-created="fetchData"
        />

        <PageTitleSection>
            <template #title>
                Indexes
            </template>
            <template #end>
                <div class="flex gap-4">
                    <Button
                        severity="secondary"
                        label="Refresh"
                        :loading="isFetchingIndexes || isFetchingStats"
                        @click="fetchData"
                    >
                        <template #icon>
                            <RefreshCw />
                        </template>
                        <template #loadingicon>
                            <RefreshCw class="animate-spin" />
                        </template>
                    </Button>
                    <Button
                        label="New Index"
                        @click="createIndexDrawerOpen = true"
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
                        />
                        <Column
                            header="Action"
                            frozen
                            alignFrozen="right"
                        >
                            <template #body="{ data }">
                                <Button
                                    v-slot="slotProps"
                                    asChild
                                    outlined
                                >
                                    <RouterLink
                                        :to="{ name: 'index-details', params: { indexUid: data.uid } }"
                                        :class="[slotProps.class, 'no-underline']"
                                    >
                                        View
                                        <ArrowRight />
                                    </RouterLink>
                                </Button>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </AppLayout>
</template>