<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import type { IndexOptions } from 'meilisearch'
import type { CreateIndexForm } from '@/types'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
    'index-created': []
}>()

const { isSendingTask, createIndex } = useIndexes()

const schema = z.object({
    uid: z.string().trim().min(1, { message: 'Please provide an index UID' }),
    primaryKey: z.string().trim().optional(),
})

const formState = reactive<CreateIndexForm>({
    uid: '',
    primaryKey: '',
})
const form = useTemplateRef('form')
const submitError = ref<string | null>(null)

async function submitNewIndex(event: FormSubmitEvent<CreateIndexForm>) {
    submitError.value = null

    try {
        const primaryKey = event.data.primaryKey || undefined
        const options: IndexOptions | undefined = primaryKey ? { primaryKey } : undefined

        await createIndex(event.data.uid, options, () => {
            open.value = false
        })
        emit('index-created')
    } catch (error) {
        submitError.value = (error as Error).message
    }
}

function reset() {
    formState.uid = ''
    formState.primaryKey = ''
    submitError.value = null
}

function focusFirstInvalidField(_event: FormErrorEvent) {
    // Let the dialog finish its focus handling before returning focus to the invalid field.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
        })
    })
}

async function submitForm() {
    await form.value?.submit()
}

watch(open, (isOpen) => {
    if (isOpen) {
        reset()
    }
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="New Index"
        description="Create an index on the current Meilisearch instance."
        :ui="{ content: 'max-w-md' }"
    >
        <template #body>
            <UForm
                id="create-index-form"
                ref="form"
                :schema="schema"
                :state="formState"
                :loading-auto="false"
                novalidate
                class="space-y-4"
                @submit="submitNewIndex"
                @error="focusFirstInvalidField"
            >
                <UAlert
                    v-if="submitError"
                    color="error"
                    variant="subtle"
                    icon="i-lucide-circle-x"
                    title="Unable to create index"
                    :description="submitError"
                />

                <UFormField
                    name="uid"
                    label="UID"
                    required
                >
                    <UInput
                        v-model="formState.uid"
                        placeholder="uid of the requested index"
                        autocomplete="off"
                        autofocus
                        class="w-full"
                    />
                </UFormField>

                <UFormField
                    name="primaryKey"
                    label="Primary Key"
                    hint="Optional"
                >
                    <UInput
                        v-model="formState.primaryKey"
                        placeholder="primary key of the requested index"
                        autocomplete="off"
                        class="w-full"
                    />
                </UFormField>
            </UForm>
        </template>

        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    :disabled="isSendingTask"
                    @click="open = false"
                />
                <UButton
                    type="button"
                    label="Create index"
                    icon="i-lucide-plus"
                    :loading="isSendingTask"
                    :disabled="isSendingTask"
                    @click="submitForm"
                />
            </div>
        </template>
    </UModal>
</template>
