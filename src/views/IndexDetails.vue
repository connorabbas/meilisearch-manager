<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useMeilisearchIndexesStore } from '@/stores/meilisearchIndexes';
import Card from 'primevue/card';
import { formatDate, formatBytes } from '@/utils';
import { Clock, Database, FileText } from 'lucide-vue-next';

const meilisearchStore = useMeilisearchStore();
const { serverStats } = storeToRefs(meilisearchStore);
const meilisearchIndexesStore = useMeilisearchIndexesStore();
const { currentIndex } = storeToRefs(meilisearchIndexesStore);

const indexStats = computed(() => {
    if (!serverStats.value || !currentIndex.value) return null;
    return serverStats.value.indexes[currentIndex.value.uid];
});
</script>

<template>
    <div>
        <div
            v-if="currentIndex && indexStats"
            class="grid grid-cols-12 items-stretch gap-4"
        >
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <Card class="h-full">
                    <template #subtitle>
                        Total Documents
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <FileText class="size-6!" /> {{ indexStats.numberOfDocuments?.toLocaleString() || 0 }}
                        </div>
                    </template>
                </Card>
            </div>
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <Card class="h-full">
                    <template #subtitle>
                        Index Size
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <Database class="size-6!" /> {{ formatBytes(indexStats.rawDocumentDbSize || 0) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="currentIndex.updatedAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Last Updated
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(currentIndex.updatedAt) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="currentIndex.createdAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Created
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(currentIndex.createdAt) }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>