<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { TASK_TYPES, TASK_STATUSES } from '@/composables/meilisearch/useTasks'
import { getTaskStatusColor } from '@/utils'
import { useConfirmAction } from '@/composables/useConfirmAction'
import type { DeleteOrCancelTasksQuery, TaskStatus, TaskType } from 'meilisearch'

const open = defineModel<boolean>('open', { default: false })
const query = defineModel<DeleteOrCancelTasksQuery>('query', { default: () => ({}) })

const emit = defineEmits<{
    submit: []
}>()

const { confirmAction } = useConfirmAction()
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes()

// Filters are kept in plain arrays because DeleteOrCancelTasksQuery fields accept
// wildcard and nested-array variants the selects never produce.
const selectedTypes = ref<TaskType[]>([])
const selectedStatuses = ref<TaskStatus[]>([])
const selectedIndexUids = ref<string[]>([])

const indexUids = computed(() => indexes.value.map((index) => index.uid))

const canSubmit = computed(() => {
    return (
        selectedTypes.value.length > 0
        || selectedStatuses.value.length > 0
        || selectedIndexUids.value.length > 0
    )
})

function reset() {
    selectedTypes.value = []
    selectedStatuses.value = []
    selectedIndexUids.value = []
    query.value = {}
}

async function submitDelete() {
    const confirmed = await confirmAction({
        title: 'Delete Tasks',
        description: 'Are you sure you want to delete these tasks?',
    })

    if (!confirmed) {
        return
    }

    query.value = {
        ...(selectedTypes.value.length ? { types: [...selectedTypes.value] } : {}),
        ...(selectedStatuses.value.length ? { statuses: [...selectedStatuses.value] } : {}),
        ...(selectedIndexUids.value.length ? { indexUids: [...selectedIndexUids.value] } : {}),
    }

    open.value = false
    emit('submit')
}

watch(open, (isVisible) => {
    reset()
    if (isVisible) {
        fetchAllIndexes()
    }
})
</script>

<template>
    <UModal
        v-model:open="open"
        title="Delete Tasks"
        description="At least one filter is required"
        :ui="{ footer: 'justify-end' }"
    >
        <template #body>
            <div class="flex flex-col gap-6">
                <UFormField label="Statuses">
                    <USelectMenu
                        v-model="selectedStatuses"
                        :items="[...TASK_STATUSES]"
                        aria-label="Task statuses"
                        multiple
                        placeholder="Any"
                        filter
                        clear
                        class="w-full"
                    >
                        <template #item-label="{ item }">
                            <UBadge
                                :color="getTaskStatusColor(item)"
                                variant="subtle"
                                :label="String(item)"
                            />
                        </template>
                    </USelectMenu>
                </UFormField>

                <UFormField label="Types">
                    <USelectMenu
                        v-model="selectedTypes"
                        :items="[...TASK_TYPES]"
                        aria-label="Task types"
                        multiple
                        placeholder="Any"
                        filter
                        clear
                        class="w-full"
                    />
                </UFormField>

                <UFormField label="Indexes">
                    <USelectMenu
                        v-model="selectedIndexUids"
                        :items="indexUids"
                        aria-label="Task indexes"
                        multiple
                        placeholder="Any"
                        filter
                        clear
                        :loading="isFetchingIndexes"
                        class="w-full"
                    />
                </UFormField>
            </div>
        </template>

        <template #footer>
            <div class="flex gap-2">
                <UButton
                    label="Cancel"
                    color="neutral"
                    variant="outline"
                    @click="open = false"
                />
                <UButton
                    label="Delete"
                    color="error"
                    :disabled="!canSubmit"
                    @click="submitDelete"
                />
            </div>
        </template>
    </UModal>
</template>