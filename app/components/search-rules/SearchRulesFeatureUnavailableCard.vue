<script setup lang="ts">
import { MIN_SEARCH_RULE_VERSION } from '@/types/search-rules'
defineProps<{
    isSupportedVersion: boolean
    version?: string | null
    isFeatureEnabled: boolean
    featureName: string
}>()
</script>

<template>
    <UCard variant="outline">
        <div class="flex flex-col items-center justify-center gap-4 p-8 text-center">
            <UIcon
                name="i-lucide-circle-alert"
                class="size-10 text-muted"
            />
            <div class="text-lg font-medium">
                {{ featureName }} are not available
            </div>
            <div class="max-w-md space-y-3 text-muted">
                <p v-if="!isSupportedVersion">
                    Your Meilisearch instance must be version <strong>{{ MIN_SEARCH_RULE_VERSION }}</strong> or higher.
                    Current version: <strong>{{ version ?? 'unknown' }}</strong>.
                </p>
                <p v-if="!isFeatureEnabled">
                    The <strong>dynamicSearchRules</strong> experimental feature must be enabled.
                    <NuxtLink
                        to="/experimental-features"
                        class="underline"
                    >Enable it here</NuxtLink>.
                </p>
            </div>
        </div>
    </UCard>
</template>
