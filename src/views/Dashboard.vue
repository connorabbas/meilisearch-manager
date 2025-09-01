<script setup lang="ts">
import { storeToRefs } from 'pinia';
import AppLayout from '@/layouts/AppLayout.vue';
import Card from 'primevue/card';
import { formatDate, formatBytes } from '@/utils';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { Clock, Database, FolderSearch, GitPullRequestArrow } from 'lucide-vue-next';

const breadcrumbs = [{ label: 'Dashboard' }];

const meilisearchStore = useMeilisearchStore();
const { serverStats, version } = storeToRefs(meilisearchStore);

async function fetchData() {
    await Promise.all([
        meilisearchStore.fetchStats(),
        meilisearchStore.fetchVersion(),
    ]);
}
await fetchData();
</script>

<template>
    <AppLayout :breadcrumbs>
        <div class="grid grid-cols-12 items-stretch gap-4">
            <div
                v-if="serverStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Database Size
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <Database class="size-6!" /> {{ formatBytes(serverStats.databaseSize) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="serverStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Total Indexes
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <FolderSearch class="size-6!" /> {{ Object.keys(serverStats.indexes).length }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="serverStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Last Updated
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(serverStats.lastUpdate) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="version"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Version
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <GitPullRequestArrow class="size-6!" /> {{ version.pkgVersion }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </AppLayout>
</template>
