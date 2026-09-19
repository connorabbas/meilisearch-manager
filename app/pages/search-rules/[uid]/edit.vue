<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import SearchRuleForm from '@/components/meilisearch/SearchRuleForm.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import { isVersionAtLeast } from '@/utils'
import type { SearchRuleUpdatePayload } from 'meilisearch'
import type { SearchRuleFormState } from '@/components/meilisearch/SearchRuleForm.vue'

definePageMeta({
    layout: 'app',
    title: 'Search Rules',
    breadcrumbs: [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Search Rules', to: '/search-rules' },
        { label: 'Edit' }
    ]
})

const route = useRoute()
const ruleUid = computed(() => String(route.params.uid ?? ''))

const {
    currentRule,
    isLoading,
    isFetching: isFetchingRule,
    fetchRule,
    createOrUpdate,
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

if (isFeatureAvailable.value && ruleUid.value) {
    await fetchRule(ruleUid.value)
}

const formState = reactive<SearchRuleFormState>({
    uid: currentRule.value?.uid ?? '',
    description: currentRule.value?.description ?? '',
    priority: currentRule.value?.priority ?? null,
    active: currentRule.value?.active ?? true,
    conditions: currentRule.value?.conditions ? [...currentRule.value.conditions] : [],
    actions: currentRule.value?.actions ? [...currentRule.value.actions] : [],
})

watch(currentRule, (rule) => {
    if (rule) {
        formState.uid = rule.uid
        formState.description = rule.description ?? ''
        formState.priority = rule.priority ?? null
        formState.active = rule.active ?? true
        formState.conditions = rule.conditions ? [...rule.conditions] : []
        formState.actions = rule.actions ? [...rule.actions] : []
    }
}, { immediate: true })

async function handleSave() {
    const payload: SearchRuleUpdatePayload = {
        description: formState.description || null,
        priority: formState.priority,
        active: formState.active,
        conditions: formState.conditions.length > 0 ? formState.conditions : null,
        actions: formState.actions.length > 0 ? formState.actions : null,
    }

    try {
        await createOrUpdate(ruleUid.value, payload)
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
                Edit Search Rule: {{ ruleUid }}
            </template>
        </PageTitleSection>

        <SearchRulesFeatureUnavailableCard
            v-if="!isFeatureAvailable"
            :is-supported-version="isSupportedVersion"
            :version="version?.pkgVersion ?? null"
            :is-feature-enabled="isFeatureEnabled"
            feature-name="Dynamic Search Rules"
        />

        <div v-else-if="isFetchingRule" class="flex justify-center p-8">
            <ProgressSpinner />
        </div>

        <SearchRuleForm
            v-else
            v-model="formState"
            v-model:is-loading="isLoading"
            is-edit
            @save="handleSave"
            @cancel="handleCancel"
        />
    </div>
</template>
