<script setup lang="ts">
import { z } from 'zod'
import { today, toCalendarDateTime, fromDate, getLocalTimeZone } from '@internationalized/date'
import { useKeys } from '@/composables/meilisearch/useKeys'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import type { KeyCreation } from 'meilisearch'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
    'key-created': []
}>()

const toast = useToast()
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes()
const { isLoading, createKey } = useKeys()

const schema = z.object({
    uid: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    indexes: z.array(z.string()).min(1, 'Select at least one index or enable “All indexes”'),
    actions: z.array(z.string()).min(1, 'Add at least one action or enable “All actions”'),
})

interface CreateKeyFormState {
    uid?: string
    name?: string
    description?: string
    indexes: string[]
    actions: string[]
    expiresAt: Date | null
}

const emptyFormState = (): CreateKeyFormState => ({
    uid: '',
    name: '',
    description: '',
    indexes: [],
    actions: [],
    expiresAt: null,
})

const formState = reactive<CreateKeyFormState>(emptyFormState())
const allIndexes = ref(false)
const allActions = ref(false)
const submitError = ref<string | null>(null)
const form = useTemplateRef('form')

const indexOptions = computed(() => indexes.value.map((index) => index.uid))

function normalizeStringArray(values?: string[] | null) {
    return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))]
}

const newKeyActions = computed<string[]>({
    get: () => formState.actions,
    set: (actions) => {
        formState.actions = normalizeStringArray(actions)
    },
})

const actionItems: string[] = []

// Pending free-entry text is read from the input element itself: the search-term
// model does not propagate typed text outward in multiple mode.
function commitPendingNewKeyAction(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
        return
    }

    const value = target.value.trim()
    if (!value) {
        return
    }

    formState.actions = normalizeStringArray([...formState.actions, value])
    target.value = ''
}

// Matches the old date picker default: tomorrow at midnight, displayed before a value is picked.
const defaultExpiryValue = toCalendarDateTime(today(getLocalTimeZone()).add({ days: 1 }))
const minExpiryValue = today(getLocalTimeZone())
const expiryValue = computed({
    get: () => (formState.expiresAt ? fromDate(formState.expiresAt, getLocalTimeZone()) : null),
    set: (value) => {
        formState.expiresAt = value ? value.toDate() : null
    },
})

async function submitNewKey() {
    submitError.value = null

    // Empty optional strings are omitted from the payload, matching the previous behavior.
    // indexes, actions, and expiresAt are always sent, matching the previous payload shape.
    const payload: KeyCreation = {
        indexes: [...formState.indexes],
        actions: normalizeStringArray(formState.actions),
        expiresAt: formState.expiresAt,
    }
    if (formState.uid) {
        payload.uid = formState.uid
    }
    if (formState.name) {
        payload.name = formState.name
    }
    if (formState.description) {
        payload.description = formState.description
    }

    try {
        await createKey(payload)
        toast.add({
            color: 'success',
            icon: 'i-lucide-circle-check',
            title: 'API Key Created',
            description: `The API key: "${payload.name}" was successfully created`,
        })
        open.value = false
        emit('key-created')
    } catch (error) {
        submitError.value = (error as Error).message
    }
}

function reset() {
    Object.assign(formState, emptyFormState())
    allIndexes.value = false
    allActions.value = false
    submitError.value = null
    form.value?.clear()
}

async function submitForm() {
    await form.value?.submit()
}

watch(open, (isOpen) => {
    if (isOpen) {
        fetchAllIndexes()
        reset()
    }
})

watch(allIndexes, (newVal) => {
    formState.indexes = (newVal) ? ['*'] : []
})
watch(allActions, (newVal) => {
    newKeyActions.value = (newVal) ? ['*'] : []
})
</script>

<template>
    <USlideover
        v-model:open="open"
        title="New API Key"
        description="Create a new API key on the current Meilisearch instance."
        :ui="{ content: 'sm:max-w-2xl' }"
    >
        <template #body>
            <UForm
                id="create-key-form"
                ref="form"
                :schema="schema"
                :state="formState"
                novalidate
                class="space-y-4 sm:space-y-6"
                @submit="submitNewKey"
            >
                <UAlert
                    v-if="submitError"
                    color="error"
                    variant="subtle"
                    icon="i-lucide-circle-x"
                    title="Unable to create key"
                    :description="submitError"
                />

                <UFormField
                    name="uid"
                    label="UID"
                    hint="Optional"
                >
                    <UInput
                        v-model="formState.uid"
                        placeholder="optional - set UID"
                        autocomplete="off"
                        class="w-full"
                    />
                </UFormField>

                <UAlert
                    color="info"
                    variant="subtle"
                    icon="i-lucide-info"
                >
                    <template #description>
                        A <a
                            href="https://www.sohamkamani.com/uuid-versions-explained/"
                            target="_blank"
                            class="text-inherit underline"
                        >uuid v4</a>
                        to identify the API key. If not specified, it is generated by Meilisearch
                    </template>
                </UAlert>

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
                        placeholder="optional - set description"
                        :rows="2"
                        autoresize
                        class="w-full"
                    />
                </UFormField>

                <div>
                    <UFormField
                        name="indexes"
                        label="Indexes"
                        required
                    >
                        <USelectMenu
                            v-model="formState.indexes"
                            :items="indexOptions"
                            multiple
                            placeholder="select permitted indexes"
                            :disabled="allIndexes"
                            :loading="isFetchingIndexes"
                            :clear="!allIndexes"
                            class="w-full"
                        />
                    </UFormField>
                    <UCheckbox
                        v-model="allIndexes"
                        label="All indexes"
                        class="mt-2"
                    />
                </div>

                <div>
                    <UFormField
                        name="actions"
                        label="Actions"
                        required
                    >
                        <UInputMenu
                            v-model="newKeyActions"
                            :items="actionItems"
                            :create-item="true"
                            :disabled="allActions"
                            placeholder="type an action and press Enter"
                            multiple
                            class="w-full"
                            @keydown.enter.prevent="commitPendingNewKeyAction"
                            @blur="commitPendingNewKeyAction"
                        />
                    </UFormField>
                    <UCheckbox
                        v-model="allActions"
                        label="All actions"
                        class="mt-2"
                    />
                    <UButton
                        href="https://www.meilisearch.com/docs/reference/api/keys/create-api-key#body-actions"
                        target="_blank"
                        label="Browse available actions"
                        trailing-icon="i-lucide-arrow-up-right"
                        color="neutral"
                        variant="link"
                        class="mt-2 p-0"
                        :ui="{ trailingIcon: 'size-3 text-dimmed' }"
                    />
                </div>

                <UFormField
                    name="expiresAt"
                    label="Expires At"
                    hint="Optional"
                >
                    <UFieldGroup class="w-full">
                        <UInputDate
                            v-model="expiryValue"
                            :default-value="defaultExpiryValue"
                            :min-value="minExpiryValue"
                            granularity="minute"
                            :hour-cycle="12"
                            class="w-full"
                        />
                        <UButton
                            label="Clear"
                            color="neutral"
                            variant="outline"
                            :disabled="!formState.expiresAt"
                            @click="formState.expiresAt = null"
                        />
                    </UFieldGroup>
                </UFormField>
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
                    label="Submit"
                    :loading="isLoading"
                    @click="submitForm"
                />
            </div>
        </template>
    </USlideover>
</template>
