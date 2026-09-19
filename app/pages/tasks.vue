<script setup lang="ts">
import { useInfiniteScroll, useIntervalFn, useStorage } from '@vueuse/core'
import { useTasks, TASK_TYPES, TASK_STATUSES } from '@/composables/meilisearch/useTasks'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { Info, Trash2 } from '@lucide/vue'
import type { Task, TasksOrBatchesQuery } from 'meilisearch'
import { formatDate, getStatusSeverity } from '@/utils'
import TaskDetailsDrawer from '@/components/meilisearch/TaskDetailsDrawer.vue'
import DeleteTasksModal from '@/components/meilisearch/DeleteTasksModal.vue'

definePageMeta({
    layout: 'app',
    title: 'Tasks',
    breadcrumbs: [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Tasks' }]
})

const { tasks, isFetching: isFetchingTasks, isPollingLatest, hasMore, fetchTasks, fetchAndAppendTasks, pollLatestTasks, deleteTasksQuery, isDeletingTasks, deleteTasks } = useTasks()
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes()
const tasksPollingEnabled = useStorage<boolean>('meilisearch-tasks-polling-enabled', false)

const tableLoading = computed(() => isPollingLatest.value || isFetchingTasks.value)

const tasksParams = reactive<TasksOrBatchesQuery>({
    limit: 50,
})

const currentTasksQuery = computed<TasksOrBatchesQuery>(() => {
    const query: TasksOrBatchesQuery = {
        limit: tasksParams.limit,
    }

    if (tasksParams.statuses?.length) {
        query.statuses = tasksParams.statuses
    }
    if (tasksParams.types?.length) {
        query.types = tasksParams.types
    }
    if (tasksParams.indexUids?.length) {
        query.indexUids = tasksParams.indexUids
    }

    return query
})

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
const taskDetailsDrawerOpen = ref(false)
const deleteTasksModalOpen = ref(false)

function showTask(task: Task) {
    currentTask.value = task
    taskDetailsDrawerOpen.value = true
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
watch(taskDetailsDrawerOpen, (isOpen) => {
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
    scrollTarget.value = document.getElementById('app-scroll-container')
    fetchAllIndexes() // for filtering options
})
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8">
        <DeleteTasksModal
            v-model:visible="deleteTasksModalOpen"
            v-model:query="deleteTasksQuery"
            @submit="handleDeleteTasks"
        />

        <TaskDetailsDrawer
            v-model:visible="taskDetailsDrawerOpen"
            :task="currentTask"
        />

        <PageTitleSection>
            <template #title>
                Tasks
            </template>
            <template #end>
                <div class="flex flex-wrap items-center gap-4">
                    <div
                        v-tooltip.top="'Poll tasks every 5 seconds'"
                        class="flex items-center gap-3"
                    >
                        <div
                            v-if="tasksPollingEnabled"
                            class="relative flex h-3 w-3 group"
                        >
                            <span
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                            />
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-400" />
                        </div>
                        <label for="tasks-polling-toggle">Poll</label>
                        <ToggleSwitch
                            v-model="tasksPollingEnabled"
                            inputId="tasks-polling-toggle"
                        />
                    </div>
                    <div>
                        <InputGroup>
                            <InputGroupAddon>
                                Limit
                            </InputGroupAddon>
                            <Select
                                v-model="tasksParams.limit"
                                :options="[20, 50, 100, 500]"
                            />
                        </InputGroup>
                    </div>
                    <div>
                        <RefreshButton
                            :loading="isFetchingTasks"
                            @click="refreshTasksList()"
                        />
                    </div>
                    <div>
                        <Button
                            label="Delete"
                            severity="danger"
                            outlined
                            :loading="isDeletingTasks"
                            @click="deleteTasksModalOpen = true"
                        >
                            <template #icon>
                                <Trash2 />
                            </template>
                        </Button>
                    </div>
                </div>
            </template>
        </PageTitleSection>

        <Card>
            <template #content>
                <DataTable
                    :value="tasks"
                    :loading="tableLoading"
                    scrollable
                    columnResizeMode="fit"
                    filterDisplay="row"
                >
                    <template #empty>
                        <NotFoundMessage subject="Task" />
                    </template>
                    <Column
                        field="uid"
                        header="UID"
                    />
                    <Column
                        field="status"
                        header="Status"
                        :showFilterMenu="false"
                    >
                        <template #filter>
                            <MultiSelect
                                v-model="tasksParams.statuses"
                                aria-label="Filter tasks by status"
                                pt:label:class="flex flex-wrap"
                                pt:overlay:class="z-1!"
                                :options="[...TASK_STATUSES]"
                                display="chip"
                                placeholder="Any"
                                :showToggleAll="false"
                                showClear
                                fluid
                            >
                                <template #option="{ option }">
                                    <Tag
                                        :value="option"
                                        :severity="getStatusSeverity(option)"
                                    />
                                </template>
                            </MultiSelect>
                        </template>
                        <template #body="{ data }">
                            <Tag
                                :value="data.status"
                                :severity="getStatusSeverity(data.status)"
                            />
                        </template>
                    </Column>
                    <Column
                        field="type"
                        header="Type"
                        :showFilterMenu="false"
                        showClearButton
                    >
                        <template #filter>
                            <MultiSelect
                                v-model="tasksParams.types"
                                aria-label="Filter tasks by type"
                                pt:label:class="flex flex-wrap"
                                pt:overlay:class="z-1!"
                                :options="[...TASK_TYPES]"
                                display="chip"
                                placeholder="Any"
                                :showToggleAll="false"
                                showClear
                                filter
                                fluid
                            />
                        </template>
                    </Column>
                    <Column
                        field="indexUid"
                        header="Index"
                        :showFilterMenu="false"
                    >
                        <template #filter>
                            <MultiSelect
                                v-model="tasksParams.indexUids"
                                aria-label="Filter tasks by index"
                                pt:label:class="flex flex-wrap"
                                pt:overlay:class="z-1!"
                                :options="indexUids"
                                display="chip"
                                placeholder="Any"
                                :showToggleAll="false"
                                :loading="isFetchingIndexes"
                                showClear
                                filter
                                fluid
                            />
                        </template>
                    </Column>
                    <Column
                        field="enqueuedAt"
                        header="Enqueued"
                    >
                        <!-- TODO: DatePicker filtering -->
                        <template #body="{ data }">
                            {{ formatDate((data as Task).enqueuedAt as string) }}
                        </template>
                    </Column>
                    <Column
                        field="finishedAt"
                        header="Finished"
                    >
                        <template #body="{ data }">
                            {{ (data as Task).finishedAt ? formatDate((data as Task).finishedAt as string) : '' }}
                        </template>
                    </Column>
                    <Column
                        frozen
                        alignFrozen="right"
                    >
                        <template #body="{ data }">
                            <Button
                                label="Details"
                                outlined
                                @click="showTask(data as Task)"
                            >
                                <template #icon>
                                    <Info />
                                </template>
                            </Button>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <div
            v-if="hasMore"
            class="mt-4 text-center text-sm text-surface-500"
        >
            Scroll to load more tasks
        </div>
    </div>
</template>
