<script setup lang="ts">
import { z } from 'zod'
import { useKeys } from '@/composables/meilisearch/useKeys'
import type { Key, KeyUpdate } from 'meilisearch'
import { formatDate } from '@/utils'

const props = withDefaults(defineProps<{
    apiKey?: Key | null,
}>(), {
    apiKey: null,
})

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
    'key-updated': []
}>()

const toast = useToast()
const { isLoading, updateKey } = useKeys()

const schema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
})

const formState = reactive<{ name?: string, description?: string }>({
    name: '',
    description: '',
})
const submitError = ref<string | null>(null)
const form = useTemplateRef('form')

async function saveKey() {
    if (!props.apiKey) {
        return
    }

    submitError.value = null

    // Empty optional strings are omitted from the payload, matching the previous behavior.
    const payload: KeyUpdate = {}
    if (formState.name) {
        payload.name = formState.name
    }
    if (formState.description) {
        payload.description = formState.description
    }

    try {
        await updateKey(props.apiKey.key, payload)
        toast.add({
            color: 'success',
            icon: 'i-lucide-circle-check',
            title: 'API Key Updated',
            description: `The API key: "${payload.name ?? props.apiKey.name}" was successfully updated`,
        })
        open.value = false
        emit('key-updated')
    } catch (error) {
        submitError.value = (error as Error).message
    }
}

async function submitForm() {
    await form.value?.submit()
}

watch(() => props.apiKey, (newVal: Key | null) => {
    formState.name = newVal?.name ?? ''
    formState.description = newVal?.description ?? ''
    submitError.value = null
}, { immediate: true })
</script>

<template>
    <USlideover
        v-model:open="open"
        title="Edit API Key"
        :ui="{ content: 'sm:max-w-2xl' }"
    >
        <template #body>
            <UForm
                id="edit-key-form"
                ref="form"
                :schema="schema"
                :state="formState"
                novalidate
                class="space-y-4 sm:space-y-6"
                @submit="saveKey"
            >
                <UAlert
                    v-if="submitError"
                    color="error"
                    variant="subtle"
                    icon="i-lucide-circle-x"
                    title="Unable to update key"
                    :description="submitError"
                />

                <UFormField
                    name="name"
                    label="Name"
                    hint="Optional"
                >
                    <UInput
                        v-model="formState.name"
                        placeholder="name your key"
                        autocomplete="off"
                        autofocus
                        class="w-full"
                    />
                </UFormField>

                <UFormField
                    name="description"
                    label="Description"
                    hint="Optional"
                >
                    <UTextarea
                        v-model="formState.description"
                        placeholder="details about the key use case"
                        :rows="2"
                        autoresize
                        class="w-full"
                    />
                </UFormField>

                <dl
                    v-if="props.apiKey"
                    class="space-y-4"
                >
                    <div>
                        <dt class="text-sm font-medium text-default">UID</dt>
                        <dd class="mt-1 text-sm break-all text-muted">
                            {{ props.apiKey.uid }}
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
                        <dd class="mt-1 text-sm text-muted">
                            {{ props.apiKey.expiresAt ? formatDate(props.apiKey.expiresAt) : 'never' }}
                        </dd>
                    </div>
                </dl>
            </UForm>
        </template>

        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    :disabled="isLoading"
                    @click="open = false"
                />
                <UButton
                    type="button"
                    label="Save"
                    :loading="isLoading"
                    @click="submitForm"
                />
            </div>
        </template>
    </USlideover>
</template>
