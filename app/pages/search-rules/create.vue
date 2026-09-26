<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import SearchRuleForm from '@/components/meilisearch/SearchRuleForm.vue'
import { isVersionAtLeast } from '@/utils'
import type { SearchRuleUpdatePayload } from 'meilisearch'
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
    return version.value ? isVersionAtLeast(version.value.pkgVersion, '1.41.0') : false
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
    actions: [],
})
const canSave = computed(() => {
    return formState.uid.trim().length > 0
        && Object.values(formState.conditions).some(Boolean)
        && formState.actions.length > 0
})

async function handleSave() {
    const payload: SearchRuleUpdatePayload = {
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
