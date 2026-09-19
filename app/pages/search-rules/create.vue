<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import SearchRuleForm from '@/components/meilisearch/SearchRuleForm.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { isVersionAtLeast } from '@/utils'
import type { SearchRuleUpdatePayload, SearchRuleCondition, SearchRuleAction } from 'meilisearch'
import type { SearchRuleFormState } from '@/components/meilisearch/SearchRuleForm.vue'

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
    priority: null,
    active: true,
    conditions: [] as SearchRuleCondition[],
    actions: [] as SearchRuleAction[],
})

async function handleSave() {
    const payload: SearchRuleUpdatePayload = {
        description: formState.description || null,
        priority: formState.priority,
        active: formState.active,
        conditions: formState.conditions.length > 0 ? formState.conditions : null,
        actions: formState.actions.length > 0 ? formState.actions : null,
    }

    try {
        await createOrUpdate(formState.uid, payload)
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
    <div class="flex flex-col gap-4 md:gap-8">
        <PageTitleSection>
            <template #title>
                Create Search Rule
            </template>
        </PageTitleSection>

        <SearchRulesFeatureUnavailableCard
            v-if="!isFeatureAvailable"
            :is-supported-version="isSupportedVersion"
            :version="version?.pkgVersion ?? null"
            :is-feature-enabled="isFeatureEnabled"
            feature-name="Dynamic Search Rules"
        />

        <SearchRuleForm
            v-else
            v-model="formState"
            v-model:is-loading="isLoading"
            is-create
            @save="handleSave"
            @cancel="handleCancel"
        />
    </div>
</template>
