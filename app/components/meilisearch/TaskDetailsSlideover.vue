<script setup lang="ts">
import type { Task } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import ThemedJsonEditor from '../ThemedJsonEditor.vue'

const props = defineProps<{
    task: Task,
}>()

const open = defineModel<boolean>('open', { default: false })

const headerTitle = computed(() => `Task ${props.task.uid}`)
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
    </USlideover>
</template>
