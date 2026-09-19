<script setup lang="ts">
import type { RuntimeTogglableFeatures } from 'meilisearch'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { camelCaseToReadable } from '@/utils'

const experimentalFeaturesDocsUrl = 'https://www.meilisearch.com/docs/resources/help/experimental_features_overview#experimental-features-overview'

definePageMeta({
    layout: 'app',
    title: 'Experimental Features',
    dashboardPanel: true,
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Experimental Features' }]
})

const {
    features,
    isFetching,
    isSubmitting,
    error,
    fetchExperimentalFeatures,
    updateExperimentalFeatures,
} = useExperimentalFeatures()

await fetchExperimentalFeatures()

const formState = ref<Record<string, boolean>>({})

function syncFormState() {
    if (!features.value) return

    formState.value = Object.fromEntries(
        Object.entries(features.value).map(([key, value]) => [key, value ?? false])
    )
}

syncFormState()
watch(features, syncFormState, { deep: true })

const featureKeys = computed(() => features.value ? Object.keys(features.value) : [])

async function handleSave() {
    const payload: RuntimeTogglableFeatures = {}
    for (const key of featureKeys.value) {
        payload[key as keyof RuntimeTogglableFeatures] = formState.value[key] ?? false
    }

    try {
        await updateExperimentalFeatures(payload)
    } catch {
        // The composable exposes the error inline and through a toast.
    }
}
</script>

<template>
    <AppDashboardPanel id="experimental-features">
        <div class="max-w-3xl space-y-4 md:space-y-6">
            <UAlert
                v-if="error"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-x"
                title="Unable to load experimental features"
                :description="error"
                :actions="[{ label: 'Retry', onClick: fetchExperimentalFeatures }]"
            />

            <UCard title="Configure Experimental Features">
                <template #description>
                    Enable API-backed experimental features. Some features instead require a CLI flag or environment
                    variable.
                    <UButton
                        :href="experimentalFeaturesDocsUrl"
                        target="_blank"
                        label="Read the experimental features overview"
                        trailing-icon="i-lucide-arrow-up-right"
                        color="neutral"
                        variant="link"
                        class="p-0"
                        :ui="{ trailingIcon: 'size-3 text-dimmed' }"
                    />
                </template>

                <div
                    v-if="isFetching"
                    aria-label="Loading experimental features"
                    class="space-y-4"
                >
                    <USkeleton
                        v-for="item in 5"
                        :key="item"
                        class="h-10 w-full rounded-md"
                    />
                </div>

                <div
                    v-else-if="featureKeys.length"
                    class="divide-y divide-default"
                >
                    <div
                        v-for="key in featureKeys"
                        :key="key"
                        class="py-4 first:pt-0 last:pb-0"
                    >
                        <USwitch
                            v-model="formState[key]"
                            :label="camelCaseToReadable(key)"
                            :disabled="isSubmitting"
                        />
                    </div>
                </div>

                <UAlert
                    v-else-if="!error"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-flask-conical"
                    title="No runtime features available"
                    description="This Meilisearch instance did not return any configurable experimental features."
                />

                <template #footer>
                    <div class="flex justify-end">
                        <UButton
                            label="Save"
                            icon="i-lucide-save"
                            :loading="isSubmitting"
                            :disabled="isFetching || featureKeys.length === 0"
                            @click="handleSave"
                        />
                    </div>
                </template>
            </UCard>
        </div>
    </AppDashboardPanel>
</template>
