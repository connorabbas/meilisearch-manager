<script setup lang="ts">
import { useMeilisearchStore } from '@/stores/meilisearch'

definePageMeta({
    layout: 'app',
    title: 'Connection Error',
    breadcrumbs: [{ label: 'Connection Error' }],
})

const meilisearchStore = useMeilisearchStore()

const errorMessage = computed(() => {
    return meilisearchStore.connectionError || 'Unable to connect to the configured Meilisearch instance.'
})

async function retryConnection() {
    if (!meilisearchStore.currentInstance?.id) {
        return
    }

    try {
        await meilisearchStore.connect(meilisearchStore.currentInstance.id)
        await navigateTo('/dashboard', { replace: true })
    } catch {
        // The store already captures and reports the connection error.
    }
}
</script>

<template>
    <AppDashboardPanel id="connection-error">
        <template #actions>
            <AppPageActions>
                <UButton
                    label="Retry Connection"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    :loading="meilisearchStore.isConnecting"
                    @click="retryConnection"
                />
            </AppPageActions>
        </template>

        <div class="flex min-h-[50svh] items-center justify-center">
            <UCard class="w-full max-w-2xl">
                <section class="flex flex-col items-center gap-6 py-6 text-center sm:py-10">
                    <div class="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
                        <UIcon
                            name="i-lucide-circle-x"
                            class="size-7"
                        />
                    </div>
                    <div class="space-y-2">
                        <h2 class="text-xl font-semibold text-highlighted">
                            Instance unavailable
                        </h2>
                        <p class="text-muted">
                            {{ meilisearchStore.currentInstance?.name || 'Current instance' }} could not be reached.
                            Choose another saved instance or retry the current connection.
                        </p>
                    </div>

                    <UAlert
                        color="error"
                        variant="subtle"
                        icon="i-lucide-circle-x"
                        title="Connection failed"
                        :description="errorMessage"
                        class="w-full text-start"
                    />
                </section>
            </UCard>
        </div>
    </AppDashboardPanel>
</template>
