<script setup lang="ts">
import { computed } from 'vue';
import { useStats } from '@/composables/meilisearch/useStats';
import { AlertCircle, ArrowRight, Home, Plus, RefreshCw } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import { useIndexes } from '@/composables/meilisearch/useIndexes';

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Indexes' }];

const { instanceStats, isFetching: isFetchingStats, fetchStats } = useStats();
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes();

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchAllIndexes(),
    ]);
}
await fetchData();

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
                    <!-- TODO -->
                    <Button label="New Index">
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
                    <!-- TODO: pagination -->
                    <DataTable
                        :value="indexesData"
                        :loading="isFetchingIndexes"
                    >
                        <template #empty>
                            <div class="flex justify-center items-center gap-2 p-5">
                                <AlertCircle />
                                <div class="text-muted-color">
                                    No Indexes found
                                </div>
                            </div>
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
                        <Column header="Action">
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