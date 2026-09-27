<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import SearchRuleForm from '@/components/meilisearch/SearchRuleForm.vue'
import { supportsSearchRules, type RuleUpdate } from '@/types/search-rules'
import type { SearchRuleFormState } from '@/types'

definePageMeta({
    layout: 'app',
    title: 'Search Rules',
    breadcrumbs: [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Search Rules', to: '/search-rules' },
        { label: 'Create' }
    ]
})

const {
    createOrUpdate,
    isLoading,
} = useDynamicSearchRules()

const {
    features,
    fetchExperimentalFeatures,
} = useExperimentalFeatures()

const {
    version,
    fetchVersion,
} = useStats()

await Promise.all([
    fetchExperimentalFeatures(),
    fetchVersion(),
])

const isSupportedVersion = computed(() => {
    return supportsSearchRules(version.value?.pkgVersion)
})

const isFeatureEnabled = computed(() => {
    return features.value?.dynamicSearchRules === true
})

const isFeatureAvailable = computed(() => isSupportedVersion.value && isFeatureEnabled.value)

const formState = reactive<SearchRuleFormState>({
    uid: '',
    description: '',
    precedence: null,
    active: true,
    conditions: {},
    actions: { pin: [], scale: [] },
})
const canSave = computed(() => {
    return isFeatureAvailable.value && formState.uid.trim().length > 0
        && formState.uid.trim() !== '__meilisearch_metadata'
        && Object.values(formState.conditions).some(Boolean)
        && (formState.actions.pin?.length || formState.actions.scale?.length)
})

async function handleSave() {
    if (!canSave.value) return
    const payload: RuleUpdate = {
        description: formState.description || null,
        precedence: formState.precedence,
        active: formState.active,
        conditions: formState.conditions,
        actions: formState.actions,
    }

    try {
        const task = await createOrUpdate(formState.uid, payload)
        if (task?.status !== 'succeeded') return
        await navigateTo('/search-rules')
    } catch {
        // error handled by composable
    }
}

async function handleCancel() {
    await navigateTo('/search-rules')
}
</script>

<template>
    <AppDashboardPanel id="create-search-rule">
        <template #actions>
            <AppPageActions>
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    @click="handleCancel"
                />
                <UButton
                    label="Save Rule"
                    icon="i-lucide-save"
                    :loading="isLoading"
                    :disabled="!canSave"
                    @click="handleSave"
                />
            </AppPageActions>
        </template>
        <SearchRulesFeatureUnavailableCard
            v-if="!isFeatureAvailable"
            :is-supported-version="isSupportedVersion"
            :version="version?.pkgVersion ?? null"
            :is-feature-enabled="isFeatureEnabled"
            feature-name="Dynamic Search Rules"
        />

        <UContainer v-else>
            <SearchRuleForm
                v-model="formState"
                v-model:is-loading="isLoading"
                is-create
            />
        </UContainer>
    </AppDashboardPanel>
</template>
