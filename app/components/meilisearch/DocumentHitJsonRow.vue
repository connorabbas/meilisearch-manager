<script setup lang="ts">
import { getRankingScoreColor, looksLikeAnImageUrl } from '@/utils'
import type { Hit } from 'meilisearch'
import ThemedJsonViewer from '../ThemedJsonViewer.vue'

const props = defineProps<{
    primaryKey?: string,
    hit: Hit,
    showRankingScore?: boolean,
}>()

defineEmits<{
    edit: [hit: Hit],
    delete: [documentId: string | number],
}>()

const imageEntry = computed(() => Object.entries(props.hit).find(([, value]) => looksLikeAnImageUrl(value)))
const image = computed(() => imageEntry.value?.[1] as string | undefined)
const imageAttribute = computed(() => imageEntry.value?.[0])
const expandedJson = ref(false)
const rankingScore = computed(() => (props.hit as Hit & { _rankingScore?: number })._rankingScore)
const rankingScorePercentage = computed(() => Math.round((rankingScore.value ?? 0) * 100))
const rankingScoreColor = computed(() => getRankingScoreColor(rankingScore.value ?? 0))
</script>

<template>
    <UCard
        variant="subtle"
        class="h-full"
    >
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <PreviewImage
                v-if="image"
                :src="image"
                alt="Document image"
                :title="imageAttribute"
                thumbnail-class="max-h-40 max-w-40 rounded-[var(--ui-radius)] border border-default object-cover object-top"
                preview-class="max-h-[80vh] max-w-[min(90vw,72rem)] rounded-[var(--ui-radius)] object-contain"
            />

            <div class="min-w-0 grow space-y-4">
                <div
                    v-if="showRankingScore && rankingScore !== undefined"
                    class="space-y-1"
                >
                    <div class="flex justify-between text-sm">
                        <span class="text-muted">Ranking score</span>
                        <span class="font-medium">{{ rankingScorePercentage }}%</span>
                    </div>
                    <UProgress
                        :model-value="rankingScorePercentage"
                        :max="100"
                        :color="rankingScoreColor"
                    />
                </div>
                <ThemedJsonViewer
                    class="rounded-[var(--ui-radius)] py-2"
                    :data="props.hit"
                    :expanded="expandedJson"
                />
            </div>

            <div class="flex shrink-0 flex-row gap-2 sm:flex-col">
                <UTooltip :text="expandedJson ? 'Collapse data' : 'Expand data'">
                    <UButton
                        :aria-label="expandedJson ? 'Collapse document data' : 'Expand document data'"
                        :icon="expandedJson ? 'i-lucide-minimize-2' : 'i-lucide-expand'"
                        color="neutral"
                        variant="outline"
                        @click="expandedJson = !expandedJson"
                    />
                </UTooltip>
                <UTooltip text="Edit document">
                    <UButton
                        aria-label="Edit document"
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="outline"
                        @click="$emit('edit', props.hit)"
                    />
                </UTooltip>
                <UTooltip
                    v-if="props.primaryKey"
                    text="Delete document"
                >
                    <UButton
                        aria-label="Delete document"
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="outline"
                        @click="$emit('delete', props.hit[props.primaryKey])"
                    />
                </UTooltip>
            </div>
        </div>
    </UCard>
</template>
