<script setup lang="ts">
import type { SearchRuleQueryCondition, SearchRuleTimeCondition } from 'meilisearch'

const open = defineModel<boolean>('open', { default: false })
const scope = defineModel<'query' | 'time'>('scope', { required: true })
const condition = defineModel<SearchRuleQueryCondition | SearchRuleTimeCondition>('condition', { required: true })
const emit = defineEmits<{ save: [] }>()

const matchType = ref<'isEmpty' | 'contains'>('isEmpty')
const contains = ref('')
const start = ref('')
const end = ref('')
const timeEmpty = computed(() => scope.value === 'time' && !start.value && !end.value)
const timeInverted = computed(() => {
    return scope.value === 'time'
        && !!start.value
        && !!end.value
        && new Date(start.value).getTime() > new Date(end.value).getTime()
})
const canSave = computed(() => {
    return scope.value === 'query'
        ? matchType.value === 'isEmpty' || contains.value.trim().length > 0
        : !timeEmpty.value && !timeInverted.value
})

function toLocalInput(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function resetForm() {
    const value = condition.value
    if (scope.value === 'query') {
        const query = value as SearchRuleQueryCondition
        matchType.value = query.words != null ? 'contains' : 'isEmpty'
        contains.value = query.words ?? ''
        start.value = ''
        end.value = ''
    } else {
        const time = value as SearchRuleTimeCondition
        start.value = toLocalInput(time.start ?? undefined)
        end.value = toLocalInput(time.end ?? undefined)
        matchType.value = 'isEmpty'
        contains.value = ''
    }
}

function save() {
    if (!canSave.value) return
    if (scope.value === 'query') {
        condition.value = matchType.value === 'isEmpty'
            ? { isEmpty: true }
            : { words: contains.value.trim() }
    } else {
        const value: SearchRuleTimeCondition = {}
        if (start.value) value.start = new Date(start.value).toISOString()
        if (end.value) value.end = new Date(end.value).toISOString()
        condition.value = value
    }
    open.value = false
    emit('save')
}

watch(open, value => {
    if (value) resetForm()
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="Condition"
        :ui="{ content: 'sm:max-w-lg' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <UFormField label="Scope">
                    <USelect
                        v-model="scope"
                        :items="[{ label: 'Query', value: 'query' }, { label: 'Time', value: 'time' }]"
                        value-key="value"
                        class="w-full"
                    />
                </UFormField>
                <template v-if="scope === 'query'">
                    <UFormField label="Match type">
                        <USelect
                            v-model="matchType"
                            :items="[{ label: 'Is Empty', value: 'isEmpty' }, { label: 'Contains', value: 'contains' }]"
                            value-key="value"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField
                        v-if="matchType === 'contains'"
                        label="Query term"
                    >
                        <UInput
                            v-model="contains"
                            placeholder="e.g. invoice"
                            class="w-full"
                        />
                    </UFormField>
                </template>
                <template v-else>
                    <UFormField label="Start date and time">
                        <UInput
                            v-model="start"
                            type="datetime-local"
                            class="w-full"
                            :highlight="timeEmpty || timeInverted"
                            color="error"
                        />
                    </UFormField>
                    <UFormField label="End date and time">
                        <UInput
                            v-model="end"
                            type="datetime-local"
                            class="w-full"
                            :highlight="timeEmpty || timeInverted"
                            color="error"
                        />
                    </UFormField>
                    <UAlert
                        v-if="timeEmpty || timeInverted"
                        color="error"
                        variant="subtle"
                        :title="timeEmpty ? 'A time condition requires at least a start or end date.' : 'Start date must be before end date.'"
                    />
                </template>
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
                    label="Save"
                    :disabled="!canSave"
                    @click="save"
                />
            </div>
        </template>
    </UModal>
</template>
