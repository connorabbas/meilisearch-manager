<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import type { FilterBuilderState, FilterCondition, FilterField, FilterGroup, FilterOperator, FilterValueType } from '@/utils/documentFilters'
import { createFilterBuilderState, filterOperators, filterValueTypes } from '@/utils/documentFilters'

const props = defineProps<{ fields: FilterField[], version: string | null, expression: { value: string | null, error: string | null } }>()
const state = defineModel<FilterBuilderState>('state', { required: true })
const toast = useToast()
const { isSupported: canCopy, copy, copied } = useClipboard()

const fieldNames = computed(() => props.fields.map(field => field.name))
const joinOptions = [
    { label: 'All (AND)', value: 'AND' },
    { label: 'Any (OR)', value: 'OR' },
]
const conditionColumns: TableColumn<FilterCondition>[] = [
    { accessorKey: 'field', header: 'Attribute' },
    { accessorKey: 'valueType', header: 'Type' },
    { accessorKey: 'operator', header: 'Operator' },
    { accessorKey: 'value', header: 'Value' },
    { id: 'actions', header: '', size: 52 },
]
function availableOperators(condition: FilterCondition) {
    const field = props.fields.find(item => item.name === condition.field)
    return filterOperators.filter((operator) => {
        if (['>', '>=', '<', '<='].includes(operator.value)) {
            return field?.comparison && condition.valueType !== 'boolean' && (condition.valueType !== 'text' || (!!props.version && isVersionAtLeast(props.version, '1.15.0')))
        }
        if (['IS NULL', 'IS NOT NULL', 'IS EMPTY', 'IS NOT EMPTY'].includes(operator.value)) {
            return field?.equality && !!props.version && isVersionAtLeast(props.version, '1.2.0')
        }
        return !!field?.equality
    })
}

function availableTypes(condition: FilterCondition) {
    const field = props.fields.find(item => item.name === condition.field)
    if (field?.equality) return [...filterValueTypes]
    return filterValueTypes.filter(type => type.value === 'number'
        || (type.value === 'text' && !!props.version && isVersionAtLeast(props.version, '1.15.0')))
}

function updateField(condition: FilterCondition, field: string) {
    condition.field = field
    condition.operator = props.fields.find(item => item.name === field)?.equality ? '=' : '>'
    condition.value = ''
    if (condition.operator === '>') condition.valueType = 'number'
}

function updateType(condition: FilterCondition, type: FilterValueType) {
    condition.valueType = type
    condition.value = ''
    if (!availableOperators(condition).some(item => item.value === condition.operator)) condition.operator = availableOperators(condition)[0]?.value ?? '='
}

function addCondition(group: FilterGroup) {
    const field = props.fields[0]
    group.conditions.push({ id: ++state.value.nextId, field: field?.name ?? '', operator: field?.equality ? '=' : '>', valueType: field?.equality ? 'text' : 'number', value: '' })
}

function addGroup() {
    const group: FilterGroup = { id: ++state.value.nextId, join: 'AND', conditions: [] }
    state.value.groups.push(group)
    addCondition(group)
}

function clear() {
    state.value = createFilterBuilderState()
}

const unary = (operator: FilterOperator) => ['EXISTS', 'NOT EXISTS', 'IS NULL', 'IS NOT NULL', 'IS EMPTY', 'IS NOT EMPTY'].includes(operator)
async function copyExpression() {
    if (!props.expression.value) return
    try {
        await copy(props.expression.value)
        toast.add({ color: 'success', icon: 'i-lucide-circle-check', title: 'Filter copied to clipboard' })
    } catch {
        toast.add({ color: 'error', icon: 'i-lucide-circle-x', title: 'Unable to copy filter' })
    }
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">Build conditions on filterable attributes. Field types are not enforced by
            Meilisearch; choose the type stored in your documents.</p>
        <UFormField
            v-if="state.groups.length > 1"
            label="Match groups"
        >
            <USelect
                v-model="state.join"
                :items="joinOptions"
                aria-label="Match groups"
                class="w-auto"
            />
        </UFormField>
        <UCard
            v-for="(group, groupIndex) in state.groups"
            :key="group.id"
            variant="subtle"
            :ui="{ body: 'p-0 sm:p-0' }"
        >
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-semibold">
                        {{ state.groups.length > 1 ? `Group ${groupIndex + 1}` : 'Conditions' }}
                    </span>
                    <div class="flex flex-wrap items-center justify-end gap-2">
                        <USelect
                            v-if="group.conditions.length > 1"
                            v-model="group.join"
                            :items="joinOptions"
                            :aria-label="`Match conditions in group ${groupIndex + 1}`"
                            class="w-auto"
                        />
                        <UButton
                            label="Add condition"
                            icon="i-lucide-plus"
                            variant="outline"
                            size="sm"
                            :disabled="!fields.length"
                            @click="addCondition(group)"
                        />
                        <UButton
                            v-if="state.groups.length > 1"
                            icon="i-lucide-x"
                            variant="ghost"
                            color="neutral"
                            size="sm"
                            :aria-label="`Remove group ${groupIndex + 1}`"
                            @click="state.groups.splice(groupIndex, 1)"
                        />
                    </div>
                </div>
            </template>
            <UTable
                :data="group.conditions"
                :columns="conditionColumns"
                :get-row-id="condition => String(condition.id)"
                :ui="{ base: 'w-full min-w-[680px]', th: 'px-1.5 py-2', td: 'px-1.5 py-2', empty: 'py-6' }"
                empty="No conditions"
            >
                <template #field-cell="{ row }">
                    <USelect
                        :model-value="row.original.field"
                        :items="fieldNames"
                        size="sm"
                        :aria-label="`Attribute for condition ${row.index + 1} in group ${groupIndex + 1}`"
                        class="w-full"
                        @update:model-value="updateField(row.original, String($event))"
                    />
                </template>
                <template #valueType-cell="{ row }">
                    <USelect
                        :model-value="row.original.valueType"
                        :items="availableTypes(row.original)"
                        size="sm"
                        :aria-label="`Value type for condition ${row.index + 1} in group ${groupIndex + 1}`"
                        class="w-full"
                        @update:model-value="updateType(row.original, $event as FilterValueType)"
                    />
                </template>
                <template #operator-cell="{ row }">
                    <USelect
                        v-model="row.original.operator"
                        :items="availableOperators(row.original)"
                        size="sm"
                        :aria-label="`Operator for condition ${row.index + 1} in group ${groupIndex + 1}`"
                        class="w-full"
                    />
                </template>
                <template #value-cell="{ row }">
                    <USelect
                        v-if="!unary(row.original.operator) && row.original.valueType === 'boolean' && !['IN', 'NOT IN'].includes(row.original.operator)"
                        v-model="row.original.value"
                        :items="[{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }]"
                        size="sm"
                        placeholder="Choose value"
                        :aria-label="`Value for condition ${row.index + 1} in group ${groupIndex + 1}`"
                        class="w-full"
                    />
                    <UInput
                        v-else-if="!unary(row.original.operator)"
                        v-model="row.original.value"
                        :type="row.original.valueType === 'number' && !['IN', 'NOT IN'].includes(row.original.operator) ? 'number' : 'text'"
                        size="sm"
                        :placeholder="['IN', 'NOT IN'].includes(row.original.operator) ? 'Comma-separated values' : 'Value'"
                        :aria-label="`Value for condition ${row.index + 1} in group ${groupIndex + 1}`"
                        class="w-full"
                    />
                    <span v-else class="text-sm text-muted">No value needed</span>
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex justify-end">
                        <UButton
                            icon="i-lucide-x"
                            color="neutral"
                            variant="ghost"
                            size="sm"
                            :aria-label="`Remove condition ${row.index + 1} in group ${groupIndex + 1}`"
                            @click="group.conditions.splice(row.index, 1)"
                        />
                    </div>
                </template>
            </UTable>
        </UCard>
        <UButton
            label="Add group"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            size="sm"
            class="self-center"
            :disabled="!fields.length"
            @click="addGroup"
        />
        <UAlert
            v-if="!fields.length"
            color="warning"
            variant="subtle"
            title="No filterable attributes"
            description="Enable filterable attributes in index settings to build a filter."
        />
        <UAlert
            v-if="props.expression.error"
            color="warning"
            variant="subtle"
            :description="props.expression.error"
        />
        <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium">Generated filter</span>
                <UButton
                    v-if="canCopy"
                    :label="copied ? 'Copied' : 'Copy'"
                    :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :disabled="!props.expression.value"
                    @click="copyExpression"
                />
            </div>
            <pre
                class="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-elevated p-3 text-xs">{{ props.expression.value ?? 'No filter' }}</pre>
        </div>
        <UButton
            label="Clear"
            color="neutral"
            icon="i-lucide-x"
            variant="outline"
            class="self-start"
            @click="clear"
        />
    </div>
</template>
