<script setup lang="ts">
import { formatBytes, formatDate } from '@/utils'
import { useStats } from '@/composables/meilisearch/useStats'
import { useMeilisearchStore } from '@/stores/meilisearch'

definePageMeta({
    layout: 'app',
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Dashboard' }]
})

const { instanceStats, version, isFetching, error, fetchStats, fetchVersion } = useStats()
const meilisearchStore = useMeilisearchStore()
const currentInstanceId = computed(() => meilisearchStore.currentInstance?.id ?? null)

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchVersion()
    ])
}

const initialInstanceId = currentInstanceId.value
if (initialInstanceId) {
    await meilisearchStore.connect(initialInstanceId)
    await fetchData()
}

watch(currentInstanceId, async (instanceId, previousInstanceId) => {
    if (!instanceId || instanceId === previousInstanceId) return

    await meilisearchStore.connect(instanceId)
    await fetchData()
})
</script>

<template>
    <AppDashboardPanel id="dashboard">
        <template #actions>
            <AppPageActions>
                <UButton
                    label="Refresh"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="outline"
                    :loading="isFetching"
                    @click="fetchData"
                />
            </AppPageActions>
        </template>

        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load dashboard statistics"
            :description="error"
            :actions="[{ label: 'Retry', onClick: fetchData }]"
        />

        <div
            v-if="isFetching && !instanceStats && !version"
            aria-label="Loading dashboard statistics"
            class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
            <USkeleton
                v-for="item in 4"
                :key="item"
                class="h-32 rounded-[var(--ui-radius)]"
            />
        </div>

        <UPageGrid
            v-else-if="instanceStats || version"
            class="gap-6 xl:grid-cols-4"
        >
            <UPageCard
                v-if="instanceStats"
                icon="i-lucide-database"
                title="Database Size"
                :description="formatBytes(instanceStats.databaseSize)"
                variant="subtle"
            />

            <UPageCard
                v-if="instanceStats"
                icon="i-lucide-folder-search"
                title="Total Indexes"
                :description="String(Object.keys(instanceStats.indexes).length)"
                variant="subtle"
            />

            <UPageCard
                v-if="instanceStats"
                icon="i-lucide-clock"
                title="Last Updated"
                :description="formatDate(instanceStats.lastUpdate)"
                variant="subtle"
            />

            <UPageCard
                v-if="version"
                icon="i-lucide-git-pull-request-arrow"
                title="Version"
                :description="version.pkgVersion"
                variant="subtle"
            />
        </UPageGrid>

        <UAlert
            v-else-if="!isFetching && !error"
            color="neutral"
            variant="subtle"
            icon="i-lucide-database"
            title="No statistics available"
            description="Refresh the page to request statistics from the current instance."
        />
    </AppDashboardPanel>
</template>
