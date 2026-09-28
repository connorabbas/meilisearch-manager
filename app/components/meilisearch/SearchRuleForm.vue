<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import SearchRuleConditionModal from './SearchRuleConditionModal.vue'
import SearchRuleActionModal from './SearchRuleActionModal.vue'
import type {
    SearchRuleFilterCondition,
    SearchRuleQueryCondition,
    SearchRuleTimeCondition,
} from 'meilisearch'
import type { SearchRuleConditionEntry, SearchRuleFormState } from '@/types'
import type { RuleActionEntry } from '@/types/search-rules'

const props = defineProps<{ isEdit?: boolean }>()
const modelValue = defineModel<SearchRuleFormState>({ required: true })
defineModel<boolean>('isLoading', { default: false })

const { confirmAction } = useConfirmAction()
const conditionOpen = ref(false)
const actionOpen = ref(false)
type Scope = SearchRuleConditionEntry['scope']
const originalConditionScope = ref<Scope | null>(null)
const editingConditionScope = ref<Scope>('query')
const actionIndex = ref<number | null>(null)
const originalActionType = ref<RuleActionEntry['type'] | null>(null)
const editingCondition = ref<SearchRuleQueryCondition | SearchRuleTimeCondition | SearchRuleFilterCondition>({ isEmpty: true })
const editingAction = ref<RuleActionEntry>({ type: 'pin', value: { indexUid: null, id: '', position: 0 } })

const conditionRows = computed<SearchRuleConditionEntry[]>(() => [
    ...(modelValue.value.conditions.query
        ? [{ scope: 'query' as const, condition: modelValue.value.conditions.query }]
        : []),
    ...(modelValue.value.conditions.time
        ? [{ scope: 'time' as const, condition: modelValue.value.conditions.time }]
        : []),
    ...(modelValue.value.conditions.filter
        ? [{ scope: 'filter' as const, condition: modelValue.value.conditions.filter }]
        : []),
])
const actionRows = computed<RuleActionEntry[]>(() => [
    ...(modelValue.value.actions.pin ?? []).map(value => ({ type: 'pin' as const, value })),
    ...(modelValue.value.actions.scale ?? []).map(value => ({ type: 'scale' as const, value })),
])
const conditionColumns: TableColumn<SearchRuleConditionEntry>[] = [
    { id: 'scope', header: 'Scope' },
    { id: 'details', header: 'Details' },
    { id: 'actions', header: '', size: 96, meta: { class: { th: 'text-end', td: 'text-end' } } },
]
const actionColumns: TableColumn<RuleActionEntry>[] = [
    { id: 'type', header: 'Type' },
    { id: 'index', header: 'Index' },
    { id: 'document', header: 'Target' },
    { id: 'position', header: 'Position / Weight' },
    { id: 'actions', header: '', size: 96, meta: { class: { th: 'text-end', td: 'text-end' } } },
]

function formatCondition(value: SearchRuleConditionEntry) {
    if (value.scope === 'query') {
        const query = value.condition

        if (query.isEmpty) return 'Query is empty'
        if (query.words) return `Query contains "${query.words}"`
        return 'Query condition'
    }

    if (value.scope === 'filter') {
        return Object.entries(value.condition.values).map(([key, match]) => `${key}: ${match}`).join(' · ')
    }
    const time = value.condition
    const start = time.start ? new Date(time.start).toLocaleString() : 'any time'
    const end = time.end ? new Date(time.end).toLocaleString() : 'any time'

    return `Time window: ${start} - ${end}`
}

function addCondition() {
    const scope = (['query', 'time', 'filter'] as const).find(key => !modelValue.value.conditions[key])
    if (!scope) return
    originalConditionScope.value = null
    editingConditionScope.value = scope
    editingCondition.value = scope === 'query' ? { isEmpty: true } : scope === 'filter' ? { values: {} } : {}
    conditionOpen.value = true
}

function editCondition(row: SearchRuleConditionEntry) {
    const value = row.condition
    if (!value) return

    originalConditionScope.value = row.scope
    editingConditionScope.value = row.scope
    editingCondition.value = structuredClone(toRaw(value))
    conditionOpen.value = true
}

function saveCondition() {
    const originalScope = originalConditionScope.value
    if (originalScope && originalScope !== editingConditionScope.value) {
        modelValue.value.conditions[originalScope] = undefined
    }

    if (editingConditionScope.value === 'query') {
        modelValue.value.conditions.query = editingCondition.value as SearchRuleQueryCondition
    } else if (editingConditionScope.value === 'time') {
        modelValue.value.conditions.time = editingCondition.value as SearchRuleTimeCondition
    } else {
        modelValue.value.conditions.filter = editingCondition.value as SearchRuleFilterCondition
    }
}

function removeCondition(scope: Scope) {
    void confirmAction({
        title: 'Delete condition',
        description: 'Are you sure you want to delete this condition?',
        confirmLabel: 'Delete',
    }, async () => {
        modelValue.value.conditions[scope] = undefined
    })
}

function addAction() {
    actionIndex.value = null
    originalActionType.value = null
    editingAction.value = { type: 'pin', value: { indexUid: null, id: '', position: 0 } }
    actionOpen.value = true
}

function editAction(row: RuleActionEntry, index: number) {
    const value = row.value
    if (!value) return

    actionIndex.value = index
    originalActionType.value = row.type
    editingAction.value = { type: row.type, value: structuredClone(toRaw(value)) } as RuleActionEntry
    actionOpen.value = true
}

function saveAction() {
    const type = editingAction.value.type
    if (actionIndex.value !== null && originalActionType.value) {
        const oldIndex = actionIndex.value - (originalActionType.value === 'scale' ? modelValue.value.actions.pin?.length ?? 0 : 0)
        if (originalActionType.value === type) {
            // Preserve action order when editing an existing entry.
            if (editingAction.value.type === 'pin') modelValue.value.actions.pin![oldIndex] = editingAction.value.value
            else modelValue.value.actions.scale![oldIndex] = editingAction.value.value
            return
        }
        modelValue.value.actions[originalActionType.value]?.splice(oldIndex, 1)
    }
    if (editingAction.value.type === 'pin') (modelValue.value.actions.pin ??= []).push(editingAction.value.value)
    else (modelValue.value.actions.scale ??= []).push(editingAction.value.value)
}

function removeAction(row: RuleActionEntry, index: number) {
    void confirmAction({
        title: 'Delete action',
        description: 'Are you sure you want to delete this action?',
        confirmLabel: 'Delete',
    }, async () => {
        const groupIndex = index - (row.type === 'scale' ? modelValue.value.actions.pin?.length ?? 0 : 0)
        modelValue.value.actions[row.type]?.splice(groupIndex, 1)
    })
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <SearchRuleConditionModal
            v-model:open="conditionOpen"
            v-model:scope="editingConditionScope"
            v-model:condition="editingCondition"
            :unavailable-scopes="conditionRows.filter(row => row.scope !== originalConditionScope).map(row => row.scope)"
            @save="saveCondition"
        />
        <SearchRuleActionModal
            v-model:open="actionOpen"
            v-model:action="editingAction"
            @save="saveAction"
        />

        <UCard variant="subtle">
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-semibold">General</span>
                    <USwitch
                        v-model="modelValue.active"
                        label="Active"
                    />
                </div>
            </template>

            <div class="grid gap-6 sm:grid-cols-[1fr_12rem]">
                <UFormField
                    label="Rule UID"
                    required
                >
                    <UInput
                        v-model="modelValue.uid"
                        placeholder="e.g. summer-sale"
                        :disabled="props.isEdit"
                        class="w-full"
                    />
                </UFormField>
                <UFormField
                    label="Priority"
                    hint="Optional"
                >
                    <UInputNumber
                        v-model="modelValue.precedence"
                        :min="0"
                        class="w-full"
                    />
                </UFormField>
            </div>

            <UFormField
                label="Description"
                hint="Optional"
                class="mt-6"
            >
                <UTextarea
                    v-model="modelValue.description"
                    placeholder="Describe the reason for this rule"
                    class="w-full"
                />
            </UFormField>
        </UCard>

        <UCard
            variant="subtle"
            :ui="{ body: 'p-0 sm:p-0' }"
        >
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-semibold">Conditions</span>
                    <UButton
                        label="Add Condition"
                        icon="i-lucide-plus"
                        size="sm"
                        variant="outline"
                        :disabled="conditionRows.length >= 3"
                        @click="addCondition"
                    />
                </div>
            </template>

            <UTable
                :data="conditionRows"
                :columns="conditionColumns"
            >
                <template #scope-cell="{ row }">
                    <UBadge
                        :label="row.original.scope"
                        color="neutral"
                        variant="subtle"
                    />
                </template>
                <template #details-cell="{ row }">{{ formatCondition(row.original) }}</template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton
                            :aria-label="`Edit condition ${row.index + 1}`"
                            icon="i-lucide-pencil"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            @click="editCondition(row.original)"
                        />
                        <UButton
                            :aria-label="`Delete condition ${row.index + 1}`"
                            icon="i-lucide-trash-2"
                            color="error"
                            variant="outline"
                            size="sm"
                            @click="removeCondition(row.original.scope)"
                        />
                    </div>
                </template>
                <template #empty>
                    <UEmpty
                        variant="naked"
                        icon="i-lucide-list-x"
                        title="No conditions"
                    />
                </template>
            </UTable>
        </UCard>

        <UCard
            variant="subtle"
            :ui="{ body: 'p-0 sm:p-0' }"
        >
            <template #header>
                <div class="flex items-center justify-between">
                    <span class="font-semibold">Actions</span>
                    <UButton
                        label="Add Action"
                        icon="i-lucide-plus"
                        size="sm"
                        variant="outline"
                        @click="addAction"
                    />
                </div>
            </template>

            <UTable
                :data="actionRows"
                :columns="actionColumns"
            >
                <template #type-cell="{ row }">
                    <UBadge
                        :label="row.original.type"
                        color="neutral"
                        variant="subtle"
                    />
                </template>
                <template #index-cell="{ row }">{{ row.original.value.indexUid ?? 'Any index' }}</template>
                <template #document-cell="{ row }">
                    {{ row.original.type === 'pin' ? row.original.value.id : [row.original.value.ids?.join(', '), row.original.value.filter ? JSON.stringify(row.original.value.filter) : ''].filter(Boolean).join(' · ') }}
                </template>
                <template #position-cell="{ row }">
                    {{ row.original.type === 'pin' ? row.original.value.position : `${row.original.value.weight === 0 ? 'Hide' : row.original.value.weight > 1 ? 'Boost' : row.original.value.weight < 1 ? 'Demote' : 'Unchanged'} ×${row.original.value.weight}` }}
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton
                            :aria-label="`Edit action ${row.index + 1}`"
                            icon="i-lucide-pencil"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            @click="editAction(row.original, row.index)"
                        />
                        <UButton
                            :aria-label="`Delete action ${row.index + 1}`"
                            icon="i-lucide-trash-2"
                            color="error"
                            variant="outline"
                            size="sm"
                            @click="removeAction(row.original, row.index)"
                        />
                    </div>
                </template>
                <template #empty>
                    <UEmpty
                        variant="naked"
                        icon="i-lucide-list-x"
                        title="No actions"
                    />
                </template>
            </UTable>
        </UCard>
    </div>
</template>
