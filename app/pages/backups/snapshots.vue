<script setup lang="ts">
import { useSnapshots } from '@/composables/meilisearch/useSnapshots'

definePageMeta({
    layout: 'app',
    title: 'Backups',
    dashboardPanel: true,
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Backups' }, { label: 'Snapshots' }]
})

const snapshotsDocsUrl = 'https://www.meilisearch.com/docs/resources/self_hosting/data_backup/snapshots'

const { isLoadingTask: isLoadingSnapshotTask, error: snapshotsError, createSnapshot } = useSnapshots()

async function createCurrentBackup() {
    try {
        await createSnapshot()
    } catch {
        // The composables expose the error inline and through a toast.
    }
}
</script>

<template>
    <div>
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
            <UButton
                :href="snapshotsDocsUrl"
                target="_blank"
                label="Read snapshots docs"
                trailing-icon="i-lucide-arrow-up-right"
                color="neutral"
                variant="soft"
                :ui="{ trailingIcon: 'size-3 text-dimmed' }"
            />
            <template #footer>
                <div class="flex justify-end">
                    <UButton
                        label="Create Snapshot"
                        icon="i-lucide-plus"
                        :loading="isLoadingSnapshotTask"
                        @click="createCurrentBackup"
                    />
                </div>
            </template>
        </UCard>
    </div>
</template>
