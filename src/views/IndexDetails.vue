<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useMeilisearchIndexesStore } from '@/stores/meilisearchIndexes';
import Card from 'primevue/card';

const meilisearchStore = useMeilisearchStore();
const { serverStats } = storeToRefs(meilisearchStore);
const meilisearchIndexesStore = useMeilisearchIndexesStore();
const { currentIndex } = storeToRefs(meilisearchIndexesStore);

const indexStats = computed(() => {
    if (!serverStats.value || !currentIndex.value) return null;
    return serverStats.value.indexes[currentIndex.value.uid];
});

// TODO: abstract to utils
const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// TODO: abstract to utils
const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
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
                        Documents
                    </template>
                    <template #content>
                        <div class="text-2xl font-semibold">
                            {{ indexStats.numberOfDocuments?.toLocaleString() || 0 }}
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
                        <div class="text-2xl font-semibold">
                            {{ formatBytes(indexStats.rawDocumentDbSize || 0) }}
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
                        <div class="text-xl font-semibold">
                            {{ formatDate(currentIndex.updatedAt) }}
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
                        <div class="text-xl font-semibold">
                            {{ formatDate(currentIndex.createdAt) }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>