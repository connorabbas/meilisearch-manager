<script setup lang="ts">
import type { Task } from 'meilisearch'
import { useIntervalFn } from '@vueuse/core'
import { Mode } from 'vanilla-jsoneditor'
import { useTasks } from '@/composables/meilisearch/useTasks'
import ThemedJsonEditor from '../ThemedJsonEditor.vue'

const props = defineProps<{
    task: Task,
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
    'task-updated': [task: Task]
}>()

const headerTitle = computed(() => `Task ${props.task.uid}`)
const toast = useToast()
const { fetchTask, cancelTask } = useTasks()
const isCancelling = ref(false)
const cancellationRequested = ref(false)
const isTaskActive = computed(() => props.task.status === 'enqueued' || props.task.status === 'processing')

const { pause: pauseTaskRefresh, resume: resumeTaskRefresh } = useIntervalFn(async () => {
    try {
        const task = await fetchTask(props.task.uid)
        emit('task-updated', task)
    } catch {
        // Keep the last known task state if a background status refresh fails.
    }
}, 1500, { immediate: false, immediateCallback: false })

watch([open, isTaskActive], ([isOpen, isActive]) => {
    if (isOpen && isActive) resumeTaskRefresh()
    else pauseTaskRefresh()
}, { immediate: true })

watch(() => props.task.status, (status, previousStatus) => {
    if (cancellationRequested.value && status === 'canceled' && previousStatus !== 'canceled') {
        toast.add({
            id: `task-cancelled-${props.task.uid}`,
            color: 'info',
            icon: 'i-lucide-ban',
            title: 'Task cancelled',
            description: `Task ${props.task.uid} was cancelled successfully.`,
            duration: 5000,
        })
    }
    if (!isTaskActive.value) cancellationRequested.value = false
})

async function handleCancelTask() {
    isCancelling.value = true
    try {
        const task = await cancelTask(props.task.uid)
        if (!task) return
        cancellationRequested.value = task.status === 'processing' || task.status === 'canceled'
        emit('task-updated', task)
    } finally {
        isCancelling.value = false
    }
}
</script>

<template>
    <USlideover
        :key="props.task.uid"
        v-model:open="open"
        :title="headerTitle"
        :ui="{ content: 'sm:max-w-4xl' }"
    >
        <template #body>
            <ThemedJsonEditor
                :modelValue="props.task"
                :mode="Mode.text"
                :main-menu-bar="false"
                :stringified="false"
                read-only
            />
        </template>

        <template
            v-if="props.task.status === 'processing'"
            #footer
        >
            <div class="flex w-full items-center justify-between gap-4">
                <UAlert
                    v-if="cancellationRequested"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-clock-3"
                    title="Cancellation requested"
                    description="Waiting for Meilisearch to confirm the task status."
                />
                <UButton
                    v-else
                    label="Cancel task"
                    icon="i-lucide-ban"
                    color="error"
                    variant="outline"
                    :loading="isCancelling"
                    :disabled="isCancelling"
                    @click="handleCancelTask"
                />
            </div>
        </template>
    </USlideover>
</template>
