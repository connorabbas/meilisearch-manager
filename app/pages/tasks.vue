<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useInfiniteScroll, useIntervalFn, useStorage } from '@vueuse/core'
import { useTasks, TASK_TYPES, TASK_STATUSES } from '@/composables/meilisearch/useTasks'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import type { Task, TasksOrBatchesQuery, TaskStatus, TaskType } from 'meilisearch'
import { formatDate, getTaskStatusColor } from '@/utils'
import TaskDetailsSlideover from '@/components/meilisearch/TaskDetailsSlideover.vue'
import DeleteTasksModal from '@/components/meilisearch/DeleteTasksModal.vue'

definePageMeta({
    layout: 'app',
    title: 'Tasks',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Tasks' }]
})

const { tasks, isFetching: isFetchingTasks, hasMore, error, fetchTasks, fetchAndAppendTasks, pollLatestTasks, deleteTasksQuery, isDeletingTasks, deleteTasks } = useTasks()
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes()
const tasksPollingEnabled = useStorage<boolean>('meilisearch-tasks-polling-enabled', false)

// Filters are kept in plain arrays because TasksOrBatchesQuery fields accept
// wildcard and nested-array variants the selects never produce.
const tasksLimit = ref(20)
const statusFilter = ref<TaskStatus[]>([])
const typeFilter = ref<TaskType[]>([])
const indexUidFilter = ref<string[]>([])

const currentTasksQuery = computed<TasksOrBatchesQuery>(() => {
    const query: TasksOrBatchesQuery = {
        limit: tasksLimit.value,
    }

    if (statusFilter.value.length) {
        query.statuses = [...statusFilter.value]
    }
    if (typeFilter.value.length) {
        query.types = [...typeFilter.value]
    }
    if (indexUidFilter.value.length) {
        query.indexUids = [...indexUidFilter.value]
    }

    return query
})

const activeFilterCount = computed(() => statusFilter.value.length + typeFilter.value.length + indexUidFilter.value.length)

function clearFilters() {
    statusFilter.value = []
    typeFilter.value = []
    indexUidFilter.value = []
}

const scrollTarget = shallowRef<HTMLElement | null>(null)
const { reset: resetInfiniteScroll } = useInfiniteScroll(
    scrollTarget,
    async () => {
        await fetchAndAppendTasks(currentTasksQuery.value)
    },
    {
        distance: 200,
        canLoadMore: () => hasMore.value && !isFetchingTasks.value,
    }
)

const { pause: pauseTaskPolling, resume: resumeTaskPolling } = useIntervalFn(
    async () => {
        await pollLatestTasks(currentTasksQuery.value)
    },
    5000,
    {
        immediate: false,
        immediateCallback: false,
    }
)

async function refreshTasksList(resetScrollState = true) {
    await fetchTasks(currentTasksQuery.value)

    if (resetScrollState) {
        await nextTick()
        resetInfiniteScroll()
    }
}

await refreshTasksList(false)

const indexUids = computed(() => indexes.value.map((index) => index.uid))

const currentTask = ref<Task | null>(null)
const taskDetailsSlideoverOpen = ref(false)
const deleteTasksModalOpen = ref(false)

function showTask(task: Task) {
    currentTask.value = task
    taskDetailsSlideoverOpen.value = true
}

async function handleDeleteTasks() {
    try {
        const result = await deleteTasks()
        if (result) {
            await refreshTasksList()
        }
    } catch {
        // Error already handled by useTasks composable via toast
    }
}

watch(taskDetailsSlideoverOpen, (isOpen) => {
    if (!isOpen) {
        setTimeout(() => {
            currentTask.value = null
        }, 250)
    }
})

watch(currentTasksQuery, async () => {
    await refreshTasksList()
})

watch(tasksPollingEnabled, async (enabled) => {
    pauseTaskPolling()

    if (!enabled) {
        return
    }

    await pollLatestTasks(currentTasksQuery.value)
    resumeTaskPolling()
}, { immediate: true })

onMounted(() => {
    scrollTarget.value = document.querySelector<HTMLElement>('.tasks-table-scroll')
    fetchAllIndexes() // for filtering options
})

const columns: TableColumn<Task>[] = [
    {
        accessorKey: 'uid',
        header: 'UID',
    },
    {
        accessorKey: 'status',
        header: 'Status',
    },
    {
        accessorKey: 'type',
        header: 'Type',
    },
    {
        accessorKey: 'indexUid',
        header: 'Index',
    },
    {
        accessorKey: 'enqueuedAt',
        header: 'Enqueued',
    },
    {
        accessorKey: 'finishedAt',
        header: 'Finished',
    },
    {
        id: 'actions',
        enableHiding: false,
        size: 96,
        minSize: 96,
        maxSize: 96,
        meta: { class: { th: 'text-end', td: 'text-end' } },
    },
]

const columnPinning = ref({ right: ['actions'] })
</script>

<template>
    <AppDashboardPanel id="tasks">
        <Teleport to="body">
            <TaskDetailsSlideover
                v-if="currentTask"
                v-model:open="taskDetailsSlideoverOpen"
                :task="currentTask"
            />
            <DeleteTasksModal
                v-model:open="deleteTasksModalOpen"
                v-model:query="deleteTasksQuery"
                @submit="handleDeleteTasks"
            />
        </Teleport>

        <template #actions>
            <AppPageActions>
                <UButton
                    aria-label="Refresh"
                    icon="i-lucide-refresh-cw"
                    loading-icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="outline"
                    :loading="isFetchingTasks"
                    @click="refreshTasksList()"
                />
                <UButton
                    label="Delete"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="outline"
                    :loading="isDeletingTasks"
                    @click="deleteTasksModalOpen = true"
                />
            </AppPageActions>
        </template>

        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load tasks"
            :description="error"
            :actions="[{ label: 'Retry', onClick: () => refreshTasksList() }]"
        />

        <UCard
            variant="outline"
            :ui="{
                header: 'shrink-0 p-4 py-3 sm:px-6',
                body: 'flex min-h-0 flex-1 flex-col p-0 sm:p-0',
            }"
            class="flex min-h-0 flex-1 flex-col"
        >
            <template #header>
                <div class="flex flex-wrap items-center gap-2">
                    <AppFiltersPopover
                        :count="activeFilterCount"
                        @clear="clearFilters"
                    >
                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-medium text-default">Status</span>
                            <USelectMenu
                                v-model="statusFilter"
                                :items="[...TASK_STATUSES]"
                                aria-label="Filter tasks by status"
                                multiple
                                clear
                                placeholder="Any"
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
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-medium text-default">Type</span>
                            <USelectMenu
                                v-model="typeFilter"
                                :items="[...TASK_TYPES]"
                                aria-label="Filter tasks by type"
                                multiple
                                placeholder="Any"
                                filter
                                clear
                                class="w-full"
                            />
                        </div>

                        <div class="flex flex-col gap-2">
                            <span class="text-sm font-medium text-default">Index</span>
                            <USelectMenu
                                v-model="indexUidFilter"
                                :items="indexUids"
                                aria-label="Filter tasks by index"
                                multiple
                                placeholder="Any"
                                filter
                                clear
                                :loading="isFetchingIndexes"
                                class="w-full"
                            />
                        </div>
                    </AppFiltersPopover>

                    <div class="flex gap-4 ms-auto">
                        <PollToggle
                            v-model="tasksPollingEnabled"
                            tooltip="Poll tasks every 5 seconds"
                        />

                        <UFieldGroup>
                            <UButton
                                as="label"
                                for="tasks-limit"
                                color="neutral"
                                variant="subtle"
                                label="Limit"
                                class="cursor-pointer"
                            />
                            <USelect
                                id="tasks-limit"
                                :model-value="tasksLimit"
                                :items="[20, 50, 100, 500]"
                                @update:model-value="tasksLimit = Number($event)"
                            />
                        </UFieldGroup>
                    </div>
                </div>
            </template>

            <UTable
                v-model:column-pinning="columnPinning"
                :data="tasks"
                :columns="columns"
                :loading="isFetchingTasks"
                sticky
                :ui="{ root: 'h-full tasks-table-scroll' }"
                class="min-h-0 flex-1"
            >
                <template #status-cell="{ row }">
                    <UBadge
                        :color="getTaskStatusColor(row.original.status)"
                        variant="subtle"
                        :label="row.original.status"
                    />
                </template>

                <template #indexUid-cell="{ row }">
                    {{ row.original.indexUid ?? '' }}
                </template>

                <template #enqueuedAt-cell="{ row }">
                    {{ formatDate(row.original.enqueuedAt) }}
                </template>

                <template #finishedAt-cell="{ row }">
                    {{ row.original.finishedAt ? formatDate(row.original.finishedAt) : '' }}
                </template>

                <template #actions-cell="{ row }">
                    <UButton
                        label="View"
                        trailing-icon="i-lucide-arrow-right"
                        color="neutral"
                        variant="subtle"
                        @click="showTask(row.original)"
                    />
                </template>

                <template #loading>
                    <div class="flex justify-center py-4">
                        <USkeleton class="h-5 w-48" />
                    </div>
                </template>

                <template #empty>
                    <UEmpty
                        variant="naked"
                        icon="i-lucide-list-checks"
                        title="No tasks found"
                    />
                </template>
            </UTable>
        </UCard>

        <div
            v-if="isFetchingTasks && tasks.length"
            class="flex justify-center py-2"
        >
            <UIcon
                name="i-lucide-loader-circle"
                class="size-4 text-muted motion-safe:animate-spin"
            />
        </div>

        <p
            v-if="hasMore"
            class="text-center text-sm text-muted"
        >
            Scroll to load more tasks
        </p>
    </AppDashboardPanel>
</template>
