<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const enabled = defineModel<boolean>('enabled', { required: true })
const rankingScoreThreshold = defineModel<number>('rankingScoreThreshold', { required: true })

const rankingScoreState = reactive({
    enabled: false,
    threshold: 0,
})

const thresholdLabel = computed(() => `${Math.round(rankingScoreState.threshold * 100)}%`)

function resetForm() {
    rankingScoreState.enabled = enabled.value
    rankingScoreState.threshold = rankingScoreThreshold.value
}
function updateThreshold(value: number[] | undefined) {
    rankingScoreState.threshold = value?.[0] ?? 0
}
function handleApply() {
    enabled.value = rankingScoreState.enabled
    rankingScoreThreshold.value = rankingScoreState.threshold
    open.value = false
}

watch(open, (isVisible) => {
    if (isVisible) resetForm()
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="Ranking Score"
        :ui="{ content: 'sm:max-w-lg' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <USwitch
                    v-model="rankingScoreState.enabled"
                    label="Show ranking score"
                    description="Display ranking scores and details for matching documents."
                />
                <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between gap-4">
                        <label class="font-medium">Ranking threshold</label>
                        <span class="text-sm text-muted">{{ thresholdLabel }}</span>
                    </div>
                    <USlider
                        :model-value="[rankingScoreState.threshold]"
                        :min="0"
                        :max="1"
                        :step="0.05"
                        @update:model-value="updateThreshold"
                    />
                    <div class="flex justify-between text-xs text-muted">
                        <span>Show all results</span>
                        <span>Best matches only</span>
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
                    @click="open = false"
                />
                <UButton
                    label="Apply"
                    @click="handleApply"
                />
            </div>
        </template>
    </UModal>
</template>
