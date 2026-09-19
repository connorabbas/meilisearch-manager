<script setup lang="ts">
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
const { indexStats, isFetching: fetchingStatsData, error: statsError, fetchIndexStats } = useStats()

async function fetchData() {
    await Promise.all([
        fetchIndex(indexUid.value),
        fetchIndexStats(indexUid.value),
    ])
}

watch(indexUid, () => {
    void fetchData()
}, { immediate: true })

const fetching = computed(() => fetchingIndexData.value || fetchingStatsData.value)
const error = computed(() => indexError.value ?? statsError.value)
</script>

<template>
    <div class="space-y-4 md:space-y-6">
        <Teleport to="#sub-page-actions">
            <UButton
                label="Refresh"
                icon="i-lucide-refresh-cw"
                loading-icon="i-lucide-refresh-cw"
                color="neutral"
                variant="outline"
                :loading="fetching"
                @click="fetchData"
            />
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
            class="grid items-start gap-6 lg:grid-cols-2"
        >
            <UPageGrid class="gap-4 sm:grid-cols-2">
                <UPageCard icon="i-lucide-file-text" title="Total Documents" :description="formatNumber(indexStats.numberOfDocuments || 0)" variant="subtle" />
                <UPageCard icon="i-lucide-database" title="Index Size" :description="formatBytes(indexStats.rawDocumentDbSize || 0)" variant="subtle" />
                <UPageCard icon="i-lucide-brain" title="Total Embeddings" :description="formatNumber(indexStats.numberOfEmbeddings || 0)" variant="subtle" />
                <UPageCard icon="i-lucide-file-check" title="Embedded Documents" :description="formatNumber(indexStats.numberOfEmbeddedDocuments || 0)" variant="subtle" />
                <UPageCard v-if="currentIndex.createdAt" icon="i-lucide-clock" title="Created" :description="formatDate(currentIndex.createdAt)" variant="subtle" />
                <UPageCard v-if="currentIndex.updatedAt" icon="i-lucide-clock" title="Last Updated" :description="formatDate(currentIndex.updatedAt)" variant="subtle" />
            </UPageGrid>

            <UCard title="Field Distribution" variant="subtle">
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
