<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import SearchRuleConditionModal from './SearchRuleConditionModal.vue'
import SearchRuleActionModal from './SearchRuleActionModal.vue'
import type {
    SearchRuleAction,
    SearchRuleQueryCondition,
    SearchRuleTimeCondition,
} from 'meilisearch'
import type { SearchRuleConditionEntry, SearchRuleFormState } from '@/types'

const props = defineProps<{ isEdit?: boolean }>()
const modelValue = defineModel<SearchRuleFormState>({ required: true })
defineModel<boolean>('isLoading', { default: false })

const { confirmAction } = useConfirmAction()
const conditionOpen = ref(false)
const actionOpen = ref(false)
const originalConditionScope = ref<'query' | 'time' | null>(null)
const editingConditionScope = ref<'query' | 'time'>('query')
const actionIndex = ref<number | null>(null)
const editingCondition = ref<SearchRuleQueryCondition | SearchRuleTimeCondition>({ isEmpty: true })
const editingAction = ref<SearchRuleAction>({
    selector: { indexUid: null, id: '' },
    action: { type: 'pin', position: 0 },
})

const conditionRows = computed<SearchRuleConditionEntry[]>(() => [
    ...(modelValue.value.conditions.query
        ? [{ scope: 'query' as const, condition: modelValue.value.conditions.query }]
        : []),
    ...(modelValue.value.conditions.time
        ? [{ scope: 'time' as const, condition: modelValue.value.conditions.time }]
        : []),
])
const conditionColumns: TableColumn<SearchRuleConditionEntry>[] = [
    { id: 'scope', header: 'Scope' },
    { id: 'details', header: 'Details' },
    { id: 'actions', header: '', size: 96, meta: { class: { th: 'text-end', td: 'text-end' } } },
]
const actionColumns: TableColumn<SearchRuleAction>[] = [
    { id: 'type', header: 'Type' },
    { id: 'index', header: 'Index' },
    { id: 'document', header: 'Document ID' },
    { id: 'position', header: 'Position' },
    { id: 'actions', header: '', size: 96, meta: { class: { th: 'text-end', td: 'text-end' } } },
]

function formatCondition(value: SearchRuleConditionEntry) {
    if (value.scope === 'query') {
        const query = value.condition

        if (query.isEmpty) return 'Query is empty'
        if (query.words) return `Query contains "${query.words}"`
        return 'Query condition'
    }

    const time = value.condition
    const start = time.start ? new Date(time.start).toLocaleString() : 'any time'
    const end = time.end ? new Date(time.end).toLocaleString() : 'any time'

    return `Time window: ${start} - ${end}`
}

function addCondition() {
    const scope = modelValue.value.conditions.query ? 'time' : 'query'
    originalConditionScope.value = null
    editingConditionScope.value = scope
    editingCondition.value = scope === 'query' ? { isEmpty: true } : {}
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
    } else {
        modelValue.value.conditions.time = editingCondition.value as SearchRuleTimeCondition
    }
}

function removeCondition(scope: 'query' | 'time') {
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
    editingAction.value = {
        selector: { indexUid: null, id: '' },
        action: { type: 'pin', position: 0 },
    }
    actionOpen.value = true
}

function editAction(index: number) {
    const value = modelValue.value.actions[index]
    if (!value) return

    actionIndex.value = index
    editingAction.value = structuredClone(toRaw(value))
    actionOpen.value = true
}

function saveAction() {
    if (actionIndex.value === null) {
        modelValue.value.actions.push(editingAction.value)
    } else {
        modelValue.value.actions[actionIndex.value] = editingAction.value
    }
}

function removeAction(index: number) {
    void confirmAction({
        title: 'Delete action',
        description: 'Are you sure you want to delete this action?',
        confirmLabel: 'Delete',
    }, async () => {
        modelValue.value.actions.splice(index, 1)
    })
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <SearchRuleConditionModal
            v-model:open="conditionOpen"
            v-model:scope="editingConditionScope"
            v-model:condition="editingCondition"
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
                        :disabled="conditionRows.length >= 2"
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
                        @click="addAction"
                    />
                </div>
            </template>

            <UTable
                :data="modelValue.actions"
                :columns="actionColumns"
            >
                <template #type-cell="{ row }">
                    <UBadge
                        :label="row.original.action.type"
                        color="neutral"
                        variant="subtle"
                    />
                </template>
                <template #index-cell="{ row }">{{ row.original.selector.indexUid }}</template>
                <template #document-cell="{ row }">{{ row.original.selector.id }}</template>
                <template #position-cell="{ row }">{{ row.original.action.position }}</template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end gap-2">
                        <UButton
                            :aria-label="`Edit action ${row.index + 1}`"
                            icon="i-lucide-pencil"
                            color="neutral"
                            variant="outline"
                            size="sm"
                            @click="editAction(row.index)"
                        />
                        <UButton
                            :aria-label="`Delete action ${row.index + 1}`"
                            icon="i-lucide-trash-2"
                            color="error"
                            variant="outline"
                            size="sm"
                            @click="removeAction(row.index)"
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
