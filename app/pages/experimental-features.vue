<script setup lang="ts">
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { camelCaseToReadable } from '@/utils'
import type { RuntimeTogglableFeatures } from 'meilisearch'

const experimentalFeaturesDocsUrl = 'https://www.meilisearch.com/docs/resources/help/experimental_features_overview#experimental-features-overview'

definePageMeta({
    layout: 'app',
    title: 'Experimental Features',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Experimental Features' }]
})

const {
    features,
    isFetching,
    isSubmitting,
    fetchExperimentalFeatures,
    updateExperimentalFeatures,
} = useExperimentalFeatures()

await fetchExperimentalFeatures()

const formState = reactive<Record<string, boolean>>({})

function syncFormState() {
    if (!features.value) return
    for (const [key, value] of Object.entries(features.value)) {
        formState[key] = value ?? false
    }
}

syncFormState()

watch(() => features.value, syncFormState, { deep: true })

const featureKeys = computed(() => {
    if (!features.value) return []
    return Object.keys(features.value)
})

async function handleSave() {
    const payload: RuntimeTogglableFeatures = {}
    for (const [key, value] of Object.entries(formState)) {
        payload[key as keyof RuntimeTogglableFeatures] = value
    }
    await updateExperimentalFeatures(payload)
}
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8 max-w-2xl">
        <PageTitleSection>
            <template #title>
                Experimental Features
            </template>
        </PageTitleSection>

        <Card
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Configure Experimental Features
            </template>
            <template #subtitle>
                <span>
                    Enable/disable API-route backed features, not all features are
                    configured via API, some require a CLI flag or ENV variable. See the
                </span>
                <Button
                    as="a"
                    label="experimental features overview"
                    variant="link"
                    :href="experimentalFeaturesDocsUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-0 no-underline rounded-none! inline"
                />
                <span class="pl-1">docs to learn more.</span>
            </template>
            <template #content>
                <div class="flex flex-col gap-6 pt-4">
                    <div
                        v-if="isFetching"
                        class="flex flex-col gap-4"
                    >
                        <Skeleton
                            v-for="i in 5"
                            :key="i"
                            height="2.5rem"
                            class="w-full"
                        />
                    </div>

                    <div
                        v-else
                        class="flex flex-col gap-4"
                    >
                        <div
                            v-for="key in featureKeys"
                            :key="key"
                            class="flex items-center gap-4"
                        >
                            <ToggleSwitch
                                :id="`feature-${key}`"
                                v-model="formState[key]"
                            />
                            <label
                                :for="`feature-${key}`"
                                class="text-sm font-medium"
                            >
                                {{ camelCaseToReadable(key) }}
                            </label>
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <Button
                            label="Save"
                            :loading="isSubmitting"
                            :disabled="isFetching"
                            @click="handleSave"
                        />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
