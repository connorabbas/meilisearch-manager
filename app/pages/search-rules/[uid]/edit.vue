<script setup lang="ts">
import { useDynamicSearchRules } from '@/composables/meilisearch/useDynamicSearchRules'
import { useExperimentalFeatures } from '@/composables/meilisearch/useExperimentalFeatures'
import { useStats } from '@/composables/meilisearch/useStats'
import SearchRuleForm from '@/components/meilisearch/SearchRuleForm.vue'
import { isVersionAtLeast } from '@/utils'
import type { SearchRule, SearchRuleUpdatePayload } from 'meilisearch'
import type { SearchRuleFormState } from '@/types'

definePageMeta({
    layout: 'app',
    title: 'Search Rules',
    dashboardPanel: true,
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

function toFormState(rule?: SearchRule | null): SearchRuleFormState {
    const value = rule ? toRaw(rule) : null

    return {
        uid: value?.uid ?? '',
        description: value?.description ?? '',
        precedence: value?.precedence ?? null,
        active: value?.active ?? true,
        conditions: structuredClone(value?.conditions ?? {}),
        actions: structuredClone(value?.actions ?? []),
    }
}

const formState = reactive<SearchRuleFormState>(toFormState(currentRule.value))

watch(currentRule, (rule) => {
    if (rule) {
        Object.assign(formState, toFormState(rule))
    }
}, { immediate: true })

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
    <AppDashboardPanel id="edit-search-rule">
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

        <div
            v-else-if="isFetchingRule"
            class="flex justify-center p-8"
        >
            <USkeleton class="h-8 w-48" />
        </div>

        <UContainer v-else>
            <SearchRuleForm
                v-model="formState"
                v-model:is-loading="isLoading"
                is-edit
            />
        </UContainer>
    </AppDashboardPanel>
</template>
