<script setup lang="ts">
import type { Key } from 'meilisearch'
import { formatDate, maskedApiKey } from '@/utils'
import { useClipboard } from '@vueuse/core'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
    apiKey: Key,
    copiedKeyUid: string | null,
}>()

const emit = defineEmits<{
    'copy-key': [key: string, uid: string]
}>()

const { isSupported: canCopy } = useClipboard()

const keyRevealed = ref(false)
const keyCopied = computed(() => props.copiedKeyUid === props.apiKey.uid)

const keyName = computed(() => props.apiKey?.name ?? 'API Key Details')
// The Meilisearch client returns key dates as ISO strings at runtime, so normalize before comparing.
const keyExpired = computed(() => {
    if (!props.apiKey.expiresAt) {
        return false
    }
    return new Date(props.apiKey.expiresAt).getTime() < Date.now()
})

watch(open, (isOpen) => {
    if (!isOpen) {
        keyRevealed.value = false
    }
})
</script>

<template>
    <USlideover
        :key="props.apiKey.uid"
        v-model:open="open"
        :title="keyName"
        :ui="{ content: 'sm:max-w-2xl' }"
    >
        <template #body>
            <dl class="space-y-5">
                <div>
                    <dt class="text-sm font-medium text-default">UID</dt>
                    <dd class="mt-1 text-sm break-all text-muted">
                        {{ props.apiKey.uid }}
                    </dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-default">Key</dt>
                    <dd class="mt-1 flex items-center gap-1">
                        <span
                            class="min-w-0 font-mono text-sm"
                            :class="keyRevealed ? 'break-all' : 'whitespace-nowrap'"
                        >
                            {{ keyRevealed ? props.apiKey.key : maskedApiKey(props.apiKey.key) }}
                        </span>
                        <UTooltip :text="keyRevealed ? 'Hide API key' : 'Reveal API key'">
                            <UButton
                                :aria-label="keyRevealed ? 'Hide API key' : 'Reveal API key'"
                                :icon="keyRevealed ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                square
                                @click="keyRevealed = !keyRevealed"
                            />
                        </UTooltip>
                        <UTooltip text="Copy API Key">
                            <UButton
                                v-if="canCopy"
                                aria-label="Copy API key"
                                :icon="keyCopied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                                color="neutral"
                                variant="ghost"
                                size="sm"
                                square
                                @click="emit('copy-key', props.apiKey.key, props.apiKey.uid)"
                            />
                        </UTooltip>
                    </dd>
                </div>
                <div v-if="props.apiKey.description">
                    <dt class="text-sm font-medium text-default">Description</dt>
                    <dd class="mt-1 text-sm text-muted">
                        {{ props.apiKey.description }}
                    </dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-default">Indexes</dt>
                    <dd class="mt-1 flex flex-wrap gap-1">
                        <template v-if="props.apiKey.indexes.length">
                            <UBadge
                                v-for="index in props.apiKey.indexes"
                                :key="index"
                                color="neutral"
                                variant="subtle"
                                :label="index"
                            />
                        </template>
                        <UBadge
                            v-else
                            color="error"
                            variant="subtle"
                            label="none"
                        />
                    </dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-default">Actions</dt>
                    <dd class="mt-1 flex flex-wrap gap-1">
                        <template v-if="props.apiKey.actions.length">
                            <UBadge
                                v-for="action in props.apiKey.actions"
                                :key="action"
                                color="neutral"
                                variant="subtle"
                                :label="action"
                            />
                        </template>
                        <UBadge
                            v-else
                            color="error"
                            variant="subtle"
                            label="none"
                        />
                    </dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-default">Expires</dt>
                    <dd class="mt-1 flex items-center gap-2 text-sm text-muted">
                        <template v-if="props.apiKey.expiresAt">
                            {{ formatDate(props.apiKey.expiresAt) }}
                            <UBadge
                                v-if="keyExpired"
                                color="error"
                                variant="subtle"
                                label="Expired"
                            />
                        </template>
                        <UBadge
                            v-else
                            color="info"
                            variant="subtle"
                            label="never"
                        />
                    </dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-default">Created</dt>
                    <dd class="mt-1 text-sm text-muted">
                        {{ formatDate(props.apiKey.createdAt) }}
                    </dd>
                </div>
                <div v-if="props.apiKey.updatedAt">
                    <dt class="text-sm font-medium text-default">Updated</dt>
                    <dd class="mt-1 text-sm text-muted">
                        {{ formatDate(props.apiKey.updatedAt) }}
                    </dd>
                </div>
            </dl>
        </template>
    </USlideover>
</template>
