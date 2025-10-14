<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useTasks } from '@/composables/meilisearch/useTasks'
import { useIndexes } from '@/composables/meilisearch/useIndexes'
import { Home, Info, RefreshCw } from 'lucide-vue-next'
import type { Task, TasksOrBatchesQuery } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import { formatDate, getStatusSeverity } from '@/utils'
import AppLayout from '@/layouts/AppLayout.vue'
import PageTitleSection from '@/components/PageTitleSection.vue'
import ThemedJsonEditor from '@/components/ThemedJsonEditor.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'

const breadcrumbs = [{ route: { name: 'dashboard' }, lucideIcon: Home }, { label: 'Tasks' }]

const { tasks, isFetching: isFetchingTasks, hasMore, fetchTasks, fetchAndAppendTasks } = useTasks()
const { indexes, isFetching: isFetchingIndexes, fetchAllIndexes } = useIndexes()

const tasksParams = reactive<TasksOrBatchesQuery>({
    limit: 50,
})

await fetchTasks(tasksParams)

const indexUids = computed(() => indexes.value.map((index) => index.uid))

const showTaskDrawerOpen = ref(false)
const currentTask = ref<Task | null>(null)
const taskHeaderTitle = computed(() => `Task ${currentTask.value?.uid}`)
function showTask(task: Task) {
    currentTask.value = task
    showTaskDrawerOpen.value = true
}

// TODO: https://vueuse.org/core/useUrlSearchParams/
// url params for route redirect from index page tasks link, or use qs package?
watch(tasksParams, (newValue) => {
    // Unset array typed properties if they have no values, to prevent bad query results
    if (newValue?.statuses?.length === 0) {
        delete tasksParams.statuses
    }
    if (newValue?.indexUids?.length === 0) {
        delete tasksParams.indexUids
    }
    if (newValue?.types?.length === 0) {
        delete tasksParams.types
    }
    fetchTasks(tasksParams)
}, { deep: true })

onMounted(() => {
    fetchAllIndexes() // for filtering options
})
</script>

<template>
    <AppLayout :breadcrumbs>
        <Drawer
            v-model:visible="showTaskDrawerOpen"
            :header="taskHeaderTitle"
            class="w-full sm:w-[60rem]"
            position="right"
            blockScroll
            @hide="currentTask = null"
        >
            <div>
                <ThemedJsonEditor
                    v-model="currentTask"
                    :mode="Mode.text"
                    :main-menu-bar="false"
                    :stringified="false"
                    read-only
                />
            </div>
        </Drawer>

        <PageTitleSection>
            <template #title>
                Tasks
            </template>
            <template #end>
                <div class="flex gap-4">
                    <div>
                        <Button
                            severity="secondary"
                            label="Refresh"
                            :loading="isFetchingTasks"
                            @click="fetchTasks()"
                        >
                            <template #icon>
                                <RefreshCw />
                            </template>
                            <template #loadingicon>
                                <RefreshCw class="animate-spin" />
                            </template>
                        </Button>
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
                </div>
            </template>
        </PageTitleSection>

        <Card>
            <template #content>
                <DataTable
                    :value="tasks"
                    :loading="isFetchingTasks"
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
                                pt:label:class="flex flex-wrap"
                                pt:overlay:class="z-1!"
                                :options="[
                                    'enqueued',
                                    'processing',
                                    'succeeded',
                                    'failed',
                                    'canceled',
                                ]"
                                display="chip"
                                placeholder="Filter by status"
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
                                pt:label:class="flex flex-wrap"
                                pt:overlay:class="z-1!"
                                :options="[
                                    'documentAdditionOrUpdate',
                                    'documentEdition',
                                    'documentDeletion',
                                    'settingsUpdate',
                                    'indexCreation',
                                    'indexDeletion',
                                    'indexUpdate',
                                    'indexSwap',
                                    'taskCancelation',
                                    'taskDeletion',
                                    'dumpCreation',
                                    'snapshotCreation',
                                    'upgradeDatabase',
                                ]"
                                display="chip"
                                placeholder="Filter by type"
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
                                pt:label:class="flex flex-wrap"
                                pt:overlay:class="z-1!"
                                :options="indexUids"
                                display="chip"
                                placeholder="Filter by index"
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
                            {{ formatDate((data as Task).finishedAt as string) }}
                        </template>
                    </Column>
                    <Column
                        header="Action"
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

        <!-- TODO: https://vueuse.org/core/useInfiniteScroll/#useinfinitescroll instead of button -->
        <div class="flex justify-center mt-4">
            <Button
                v-if="hasMore"
                :loading="isFetchingTasks"
                label="Load More"
                @click="fetchAndAppendTasks(tasksParams)"
            />
        </div>
    </AppLayout>
</template>
