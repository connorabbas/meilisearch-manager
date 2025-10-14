<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue'
import { formatDate, formatBytes } from '@/utils'
import { Clock, Database, FolderSearch, GitPullRequestArrow } from 'lucide-vue-next'
import { useStats } from '@/composables/meilisearch/useStats'

const breadcrumbs = [{ label: 'Dashboard' }]

const { instanceStats, version, fetchStats, fetchVersion } = useStats()

async function fetchData() {
    await Promise.all([
        fetchStats(),
        fetchVersion(),
    ])
}
await fetchData()
</script>

<template>
    <AppLayout :breadcrumbs>
        <!-- TODO error messaging -->
        <div class="grid grid-cols-12 items-stretch gap-4">
            <div
                v-if="instanceStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Database Size
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <Database class="size-6!" /> {{ formatBytes(instanceStats.databaseSize) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="instanceStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Total Indexes
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-2xl font-semibold">
                            <FolderSearch class="size-6!" /> {{ Object.keys(instanceStats.indexes).length }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="instanceStats"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #subtitle>
                        Last Updated
                    </template>
                    <template #content>
                        <div class="flex gap-3 items-center text-xl font-semibold">
                            <Clock class="size-6!" /> {{ formatDate(instanceStats.lastUpdate) }}
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
