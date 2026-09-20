<script setup lang="ts">
import { useIntervalFn, useStorage } from '@vueuse/core'
import FieldDistributionChart from '@/components/meilisearch/FieldDistributionChart.vue'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { useStats } from '@/composables/meilisearch/useStats'
import { formatNumber } from '@/utils'

definePageMeta({
    layout: 'app',
    title: 'Index Stats',
})

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const { currentIndex, isFetching: fetchingIndexData, error: indexError, fetchIndex } = useIndexes()
const { indexStats, isFetching: fetchingStatsData, error: statsError, fetchIndexStats, pollIndexStats } = useStats()
const statsPollingEnabled = useStorage<boolean>('meilisearch-index-stats-polling-enabled', true)

async function fetchData() {
    await Promise.all([
        fetchIndex(indexUid.value),
        fetchIndexStats(indexUid.value),
    ])
}

const { pause: pauseStatsPolling, resume: resumeStatsPolling } = useIntervalFn(
    async () => {
        await pollIndexStats(indexUid.value)
    },
    5000,
    {
        immediate: false,
        immediateCallback: false,
    }
)

watch(indexUid, () => {
    void fetchData()
}, { immediate: true })

watch(statsPollingEnabled, async (enabled) => {
    pauseStatsPolling()

    if (!enabled) {
        return
    }

    await pollIndexStats(indexUid.value)
    resumeStatsPolling()
}, { immediate: true })

const fetching = computed(() => fetchingIndexData.value || fetchingStatsData.value)
const error = computed(() => indexError.value ?? statsError.value)
</script>

<template>
    <div class="space-y-4 md:space-y-6">
        <Teleport to="#sub-page-actions">
            <div class="flex items-center gap-4">
                <PollToggle
                    v-model="statsPollingEnabled"
                    tooltip="Poll index stats every 5 seconds"
                />
                <UButton
                    label="Refresh"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="outline"
                    :loading="fetching"
                    @click="fetchData"
                />
            </div>
        </Teleport>

        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load index statistics"
            :description="error"
            :actions="[{ label: 'Retry', onClick: fetchData }]"
        />

        <div
            v-if="fetching && !currentIndex && !indexStats"
            aria-label="Loading index statistics"
            class="grid gap-4 lg:grid-cols-2"
        >
            <div class="grid gap-4 sm:grid-cols-2">
                <USkeleton
                    v-for="card in 6"
                    :key="card"
                    class="h-32 rounded-lg"
                />
            </div>
            <USkeleton class="h-96 rounded-lg" />
        </div>

        <div
            v-else-if="currentIndex && indexStats"
            class="grid gap-6 lg:grid-cols-2"
        >
            <UPageGrid class="gap-4 sm:grid-cols-2">
                <UPageCard
                    icon="i-lucide-key-round"
                    title="Primary Key"
                    variant="subtle"
                >
                    <template #description>
                        <UBadge
                            color="info"
                            variant="subtle"
                            :label="currentIndex.primaryKey ?? '—'"
                        />
                    </template>
                </UPageCard>
                <UPageCard
                    icon="i-lucide-cloud-backup"
                    title="Actively Indexing"
                    variant="subtle"
                >
                    <template #description>
                        <UBadge
                            :color="indexStats.isIndexing ? 'success' : 'warning'"
                            variant="subtle"
                            :label="indexStats.isIndexing ? 'Yes' : 'No'"
                        />
                    </template>
                </UPageCard>
                <UPageCard
                    icon="i-lucide-database"
                    title="Index Size"
                    :description="formatBytes(indexStats.rawDocumentDbSize || 0)"
                    variant="subtle"
                />
                <UPageCard
                    icon="i-lucide-file-text"
                    title="Total Documents"
                    :description="formatNumber(indexStats.numberOfDocuments || 0)"
                    variant="subtle"
                />
                <UPageCard
                    icon="i-lucide-brain"
                    title="Total Embeddings"
                    :description="formatNumber(indexStats.numberOfEmbeddings || 0)"
                    variant="subtle"
                />
                <UPageCard
                    icon="i-lucide-file-check"
                    title="Embedded Documents"
                    :description="formatNumber(indexStats.numberOfEmbeddedDocuments || 0)"
                    variant="subtle"
                />
                <UPageCard
                    icon="i-lucide-scale"
                    title="Average Document Size"
                    :description="formatBytes(indexStats.avgDocumentSize || 0)"
                    variant="subtle"
                />
                <UPageCard
                    v-if="currentIndex.createdAt"
                    icon="i-lucide-clock"
                    title="Created"
                    :description="formatDate(currentIndex.createdAt)"
                    variant="subtle"
                />
                <UPageCard
                    v-if="currentIndex.updatedAt"
                    icon="i-lucide-clock"
                    title="Last Updated"
                    :description="formatDate(currentIndex.updatedAt)"
                    variant="subtle"
                />
            </UPageGrid>

            <UCard
                title="Field Distribution"
                variant="subtle"
                class="h-full"
                :ui="{ root: 'h-full flex flex-col', body: 'flex-1' }"
            >
                <FieldDistributionChart :field-distribution="indexStats.fieldDistribution" />
            </UCard>
        </div>

        <UAlert
            v-else-if="!fetching && !error"
            color="neutral"
            variant="subtle"
            icon="i-lucide-chart-pie"
            title="No index statistics available"
            description="Refresh the page to request statistics for this index."
        />
    </div>
</template>
