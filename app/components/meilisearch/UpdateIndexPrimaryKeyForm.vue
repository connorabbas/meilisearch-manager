<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes'

const props = defineProps<{
    formId: string,
    indexUid: string,
    index: { primaryKey?: string | null },
}>()

const emit = defineEmits<{
    'refetch-index': [],
    'update:loading': [value: boolean],
}>()

const { error, isLoadingTask, updateIndex } = useIndexes()
const state = reactive({ primaryKey: props.index.primaryKey ?? '' })

watch(() => props.index.primaryKey, primaryKey => {
    state.primaryKey = primaryKey ?? ''
})

watch(isLoadingTask, loading => emit('update:loading', loading), { immediate: true })

async function handleUpdatePrimaryKey() {
    if (!state.primaryKey) return

    try {
        const task = await updateIndex(props.indexUid, state.primaryKey)
        if (task?.status === 'succeeded') emit('refetch-index')
    } catch {
        // The composable exposes failures inline and through a toast.
    }
}
</script>

<template>
    <form
        :id="formId"
        class="space-y-6"
        @submit.prevent="handleUpdatePrimaryKey"
    >
        <UFormField
            name="primaryKey"
            label="Primary Key"
            description="You can freely update the primary key of an index as long as it contains no documents. To change the
            primary key of an index that already contains documents, first delete all documents in that index."
            required
            :error="error ?? undefined"
        >
            <UInput
                v-model="state.primaryKey"
                type="text"
                autofocus
                required
                class="w-full"
            />
        </UFormField>
    </form>
</template>
