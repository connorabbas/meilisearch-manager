<script setup lang="ts">
import { computed } from 'vue';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { storeToRefs } from 'pinia';
import { ArrowRight, Home, Inbox, Plus, RefreshCw } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Indexes' }];

const meiliStore = useMeilisearchStore();
const {
    indexes,
    isLoadingIndexes,
    serverStats,
} = storeToRefs(meiliStore);

await meiliStore.fetchIndexes();

const indexesData = computed(() => {
    return indexes.value.map((index) => {
        return {
            ...index,
            numberOfDocuments: serverStats.value?.indexes[index.uid].numberOfDocuments,
        };
    });
});

/* const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}; */
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
                        :loading="isLoadingIndexes"
                        @click="meiliStore.fetchIndexes()"
                    >
                        <template #icon>
                            <RefreshCw />
                        </template>
                    </Button>
                    <Button label="Create New Index">
                        <template #icon>
                            <Plus />
                        </template>
                    </Button>
                </div>
            </template>
        </PageTitleSection>

        <div>
            <!-- <Card
                v-if="serverStats"
                class="mb-4"
            >
                <template #title>Server Statistics</template>
                <template #content>
                    <div class="grid">
                        <div class="col-3">
                            Total Indexes:
                            <pre>{{ serverStats.indexes }}</pre>
                        </div>
                        <div class="col-3">
                            Database Size: {{ formatBytes(serverStats.databaseSize) }}
                        </div>
                    </div>
                </template>
            </Card> -->
            <Card>
                <template #content>
                    <DataTable
                        :value="indexesData"
                        :loading="isLoadingIndexes"
                    >
                        <template #empty>
                            <div class="flex flex-col items-center p-5">
                                <Inbox />
                                <p class="mt-3 text-muted-color">
                                    No indexes found
                                </p>
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
                                        :to="{ name: 'index-details', params: { indexUID: data.uid } }"
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