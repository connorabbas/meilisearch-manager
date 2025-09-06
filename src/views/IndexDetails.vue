<script setup lang="ts">
import { useStats } from '@/composables/meilisearch/useStats';
import { formatDate, formatBytes } from '@/utils';
import { Clock, Database, FileText } from 'lucide-vue-next';
import type { Index } from 'meilisearch';

const props = defineProps<{
    indexUid: string,
    index: Index,
}>();

const { indexStats, fetchIndexStats } = useStats();
await fetchIndexStats(props.indexUid);
</script>

<template>
    <div>
        <!-- TODO: more stat cards: avg doc size, number of embeddings/docs, field distribution -->
        <div
            v-if="props.index && indexStats"
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
                v-if="props.index.updatedAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Last Updated
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(props.index.updatedAt) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="props.index.createdAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Created
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(props.index.createdAt) }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>