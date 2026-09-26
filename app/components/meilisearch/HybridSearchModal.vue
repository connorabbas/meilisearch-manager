<script setup lang="ts">
import type { HybridSearch } from 'meilisearch'
import type { IndexEmbedderOption } from '@/types'

const props = defineProps<{
    embedders: IndexEmbedderOption[]
}>()
const open = defineModel<boolean>('open', { default: false })

const hybridSearch = defineModel<HybridSearch | null>('hybridSearch', { required: true })
const enabled = defineModel<boolean>('enabled', { required: true })

const hybridSearchState = reactive({
    enabled: false,
    embedder: '',
    semanticRatio: 0.5,
})

const selectedEmbedder = computed(() => {
    return props.embedders.find(embedder => embedder.name === hybridSearchState.embedder)
})
const selectedEmbedderModel = computed<string | undefined>(() => {
    const settings = selectedEmbedder.value?.settings

    if (settings && 'model' in settings) {
        return settings.model
    }

    return undefined
})
const semanticRatioLabel = computed(() => `${Math.round(hybridSearchState.semanticRatio * 100)}% semantic`)

function resetForm() {
    hybridSearchState.enabled = enabled.value
    hybridSearchState.embedder = hybridSearch.value?.embedder ?? props.embedders[0]?.name ?? ''
    hybridSearchState.semanticRatio = hybridSearch.value?.semanticRatio ?? 0.5
}

function handleCancel() {
    open.value = false
}

function updateSemanticRatio(value: number[] | undefined) {
    hybridSearchState.semanticRatio = value?.[0] ?? 0.5
}

function handleHybridSearchConfig() {
    if (!hybridSearchState.embedder) {
        return
    }

    hybridSearch.value = {
        embedder: hybridSearchState.embedder,
        semanticRatio: hybridSearchState.semanticRatio,
    }
    enabled.value = hybridSearchState.enabled
    open.value = false
}

watch(open, (isVisible) => {
    if (isVisible) {
        resetForm()
    }
})

watch(() => props.embedders, () => {
    if (!open.value) {
        return
    }

    if (!props.embedders.some(embedder => embedder.name === hybridSearchState.embedder)) {
        hybridSearchState.embedder = props.embedders[0]?.name ?? ''
    }
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="Hybrid Search"
        :ui="{ content: 'sm:max-w-lg' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <USwitch
                    v-model="hybridSearchState.enabled"
                    label="Enabled"
                    description="Include semantic similarity in document searches."
                />
                <UFormField
                    label="Embedder"
                    :hint="selectedEmbedderModel ? `Model: ${selectedEmbedderModel}` : undefined"
                >
                    <USelect
                        v-model="hybridSearchState.embedder"
                        :items="embedders"
                        value-key="name"
                        placeholder="Select an embedder"
                        class="w-full"
                    />
                </UFormField>

                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between gap-4">
                        <label class="font-medium">Semantic ratio</label>
                        <span class="text-sm text-muted">{{ semanticRatioLabel }}</span>
                    </div>
                    <USlider
                        :model-value="[hybridSearchState.semanticRatio]"
                        :min="0"
                        :max="1"
                        :step="0.05"
                        @update:model-value="updateSemanticRatio"
                    />
                    <div class="flex justify-between text-xs text-muted">
                        <span>Full-text</span>
                        <span>Semantic</span>
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    @click="handleCancel"
                />
                <UButton
                    label="Apply"
                    :disabled="!hybridSearchState.embedder"
                    @click="handleHybridSearchConfig"
                />
            </div>
        </template>
    </UModal>
</template>
