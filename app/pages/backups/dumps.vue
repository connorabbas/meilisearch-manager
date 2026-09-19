<script setup lang="ts">
import { useDumps } from '@/composables/meilisearch/useDumps'

definePageMeta({
    layout: 'app',
    title: 'Backups',
    dashboardPanel: true,
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Backups' }, { label: 'Dumps' }]
})

const dumpsDocsUrl = 'https://www.meilisearch.com/docs/resources/self_hosting/data_backup/dumps'

const { isLoadingTask, error: dumpsError, createDump } = useDumps()

async function createCurrentBackup() {
    try {
        await createDump()
    } catch {
        // The composables expose the error inline and through a toast.
    }
}
</script>

<template>
    <div>
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
            variant="subtle"
        >
            <UButton
                :href="dumpsDocsUrl"
                target="_blank"
                label="Read dumps docs"
                trailing-icon="i-lucide-arrow-up-right"
                color="neutral"
                variant="soft"
                :ui="{ trailingIcon: 'size-3 text-dimmed' }"
            />
            <template #footer>
                <div class="flex justify-end">
                    <UButton
                        label="Create Dump"
                        icon="i-lucide-plus"
                        :loading="isLoadingTask"
                        @click="createCurrentBackup"
                    />
                </div>
            </template>
        </UCard>
    </div>
</template>
