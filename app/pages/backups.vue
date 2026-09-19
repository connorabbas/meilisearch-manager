<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useDumps } from '@/composables/meilisearch/useDumps'
import { useSnapshots } from '@/composables/meilisearch/useSnapshots'

definePageMeta({
    layout: 'app',
    title: 'Backups',
    dashboardPanel: true,
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Backups' }]
})

const currentTab = ref('dumps')
const tabs: TabsItem[] = [
    { label: 'Dumps', value: 'dumps', slot: 'dumps' },
    { label: 'Snapshots', value: 'snapshots', slot: 'snapshots' },
]
const dumpsDocsUrl = 'https://www.meilisearch.com/docs/resources/self_hosting/data_backup/dumps'
const snapshotsDocsUrl = 'https://www.meilisearch.com/docs/resources/self_hosting/data_backup/snapshots'

const { isLoadingTask, error: dumpsError, createDump } = useDumps()
const { isLoadingTask: isLoadingSnapshotTask, error: snapshotsError, createSnapshot } = useSnapshots()

async function createCurrentBackup() {
    try {
        if (currentTab.value === 'dumps') {
            await createDump()
        } else {
            await createSnapshot()
        }
    } catch {
        // The composables expose the error inline and through a toast.
    }
}

const currentActionLabel = computed(() => currentTab.value === 'dumps' ? 'Create Dump' : 'Create Snapshot')
const currentActionLoading = computed(() => currentTab.value === 'dumps' ? isLoadingTask.value : isLoadingSnapshotTask.value)
</script>

<template>
    <AppDashboardPanel id="backups">
        <template #actions>
            <UButton
                :label="currentActionLabel"
                icon="i-lucide-plus"
                :loading="currentActionLoading"
                @click="createCurrentBackup"
            />
        </template>

        <UTabs
            v-model="currentTab"
            :items="tabs"
            variant="link"
            class="w-full"
        >
            <template #dumps>
                <div class="pt-4">
                    <UAlert
                        v-if="dumpsError"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-circle-x"
                        title="Unable to create dump"
                        :description="dumpsError"
                        class="mb-4"
                    />

                    <UCard
                        title="Export a dump"
                        description="Dumps are portable backups best suited for migrating data between Meilisearch versions."
                    >
                        <template #footer>
                            <div class="flex flex-wrap items-center gap-3">
                                <UButton
                                    label="Create Dump"
                                    icon="i-lucide-plus"
                                    :loading="isLoadingTask"
                                    class="sm:hidden"
                                    @click="createCurrentBackup"
                                />
                                <UButton
                                    :href="dumpsDocsUrl"
                                    target="_blank"
                                    label="Read dumps docs"
                                    trailing-icon="i-lucide-arrow-up-right"
                                    color="neutral"
                                    variant="link"
                                    :ui="{ trailingIcon: 'size-3 text-dimmed' }"
                                />
                            </div>
                        </template>
                    </UCard>
                </div>
            </template>

            <template #snapshots>
                <div class="pt-4">
                    <UAlert
                        v-if="snapshotsError"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-circle-x"
                        title="Unable to create snapshot"
                        :description="snapshotsError"
                        class="mb-4"
                    />

                    <UCard
                        title="Export a snapshot"
                        description="Snapshots are exact database copies intended for fast recovery on the same Meilisearch version."
                    >
                        <template #footer>
                            <div class="flex flex-wrap items-center gap-3">
                                <UButton
                                    label="Create Snapshot"
                                    icon="i-lucide-plus"
                                    :loading="isLoadingSnapshotTask"
                                    class="sm:hidden"
                                    @click="createCurrentBackup"
                                />
                                <UButton
                                    :href="snapshotsDocsUrl"
                                    target="_blank"
                                    label="Read snapshots docs"
                                    trailing-icon="i-lucide-arrow-up-right"
                                    color="neutral"
                                    variant="link"
                                    :ui="{ trailingIcon: 'size-3 text-dimmed' }"
                                />
                            </div>
                        </template>
                    </UCard>
                </div>
            </template>
        </UTabs>
    </AppDashboardPanel>
</template>
