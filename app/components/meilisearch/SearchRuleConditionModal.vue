<script setup lang="ts">
import type { SearchRuleQueryCondition, SearchRuleTimeCondition, SearchRuleFilterCondition } from 'meilisearch'

const open = defineModel<boolean>('open', { default: false })
const scope = defineModel<'query' | 'time' | 'filter'>('scope', { required: true })
const condition = defineModel<SearchRuleQueryCondition | SearchRuleTimeCondition | SearchRuleFilterCondition>('condition', { required: true })
const props = defineProps<{ unavailableScopes?: Array<'query' | 'time' | 'filter'> }>()
const emit = defineEmits<{ save: [] }>()

const matchType = ref<'isEmpty' | 'contains'>('isEmpty')
const contains = ref('')
const start = ref('')
const end = ref('')
const values = ref<Array<{ attribute: string; value: string }>>([])
const scopeItems = computed(() => (['query', 'time', 'filter'] as const)
    .filter(item => item === scope.value || !props.unavailableScopes?.includes(item))
    .map(item => ({ label: item.charAt(0).toUpperCase() + item.slice(1), value: item })))
const filterValid = computed(() => values.value.length > 0
    && values.value.every(row => row.attribute.trim() && row.value.trim())
    && new Set(values.value.map(row => row.attribute.trim())).size === values.value.length)
const timeEmpty = computed(() => scope.value === 'time' && !start.value && !end.value)
const timeInverted = computed(() => {
    return scope.value === 'time'
        && !!start.value
        && !!end.value
        && new Date(start.value).getTime() > new Date(end.value).getTime()
})
const canSave = computed(() => {
    if (scope.value === 'query') return matchType.value === 'isEmpty' || contains.value.trim().length > 0
    if (scope.value === 'filter') return filterValid.value
    return !timeEmpty.value && !timeInverted.value
})

function toLocalInput(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function resetForm() {
    const value = condition.value
    matchType.value = 'isEmpty'
    contains.value = ''
    start.value = ''
    end.value = ''
    values.value = []
    if (scope.value === 'query') {
        const query = value as SearchRuleQueryCondition
        matchType.value = query.words != null ? 'contains' : 'isEmpty'
        contains.value = query.words ?? ''
    } else if (scope.value === 'time') {
        const time = value as SearchRuleTimeCondition
        start.value = toLocalInput(time.start ?? undefined)
        end.value = toLocalInput(time.end ?? undefined)
    } else {
        values.value = Object.entries((value as SearchRuleFilterCondition).values ?? {}).map(([attribute, value]) => ({ attribute, value }))
    }
}

function save() {
    if (!canSave.value) return
    if (scope.value === 'query') {
        condition.value = matchType.value === 'isEmpty'
            ? { isEmpty: true }
            : { words: contains.value.trim() }
    } else if (scope.value === 'time') {
        const value: SearchRuleTimeCondition = {}
        if (start.value) value.start = new Date(start.value).toISOString()
        if (end.value) value.end = new Date(end.value).toISOString()
        condition.value = value
    } else {
        condition.value = { values: Object.fromEntries(values.value.map(row => [row.attribute.trim(), row.value.trim()])) }
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
                        :items="scopeItems"
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
                <template v-else-if="scope === 'time'">
                    <UAlert
                        v-if="timeEmpty || timeInverted"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-circle-x"
                        :title="timeEmpty ? 'A time condition requires at least a start or end date.' : 'Start date must be before end date.'"
                    />
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
                </template>
                <template v-else>
                    <p class="text-sm text-muted">Activate when the search request filter matches an attribute value.
                    </p>
                    <UAlert
                        v-if="values.length && !filterValid"
                        color="warning"
                        variant="subtle"
                        icon="i-lucide-triangle-alert"
                        title="Enter distinct attributes and nonempty values."
                    />
                    <div
                        v-for="(row, index) in values"
                        :key="index"
                        class="flex gap-2"
                    >
                        <UInput
                            v-model="row.attribute"
                            :aria-label="`Filter attribute ${index + 1}`"
                            placeholder="Attribute"
                            class="flex-1"
                        />
                        <UInput
                            v-model="row.value"
                            :aria-label="`Filter value ${index + 1}`"
                            placeholder="Value"
                            class="flex-1"
                        />
                        <UButton
                            icon="i-lucide-trash-2"
                            :aria-label="`Remove filter value ${index + 1}`"
                            color="error"
                            variant="outline"
                            @click="values.splice(index, 1)"
                        />
                    </div>
                    <UButton
                        label="Add value"
                        icon="i-lucide-plus"
                        variant="outline"
                        color="neutral"
                        size="sm"
                        class="w-auto self-center"
                        @click="values.push({ attribute: '', value: '' })"
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
