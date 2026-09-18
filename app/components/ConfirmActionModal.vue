<script setup lang="ts">
const props = withDefaults(defineProps<{
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
}>(), {
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
})

const emit = defineEmits<{
    close: [confirmed: boolean];
}>()

const open = defineModel<boolean>('open', { default: false })
const resolved = ref(false)

function resolve(confirmed: boolean) {
    if (resolved.value) return

    resolved.value = true
    emit('close', confirmed)
}

watch(open, (isOpen) => {
    if (isOpen) {
        resolved.value = false
    } else {
        resolve(false)
    }
})
</script>

<template>
    <UModal
        v-model:open="open"
        :title="props.title"
        :description="props.description"
        :ui="{ footer: 'justify-end' }"
    >
        <template #footer>
            <UButton
                :label="props.cancelLabel"
                color="neutral"
                variant="outline"
                @click="resolve(false)"
            />
            <UButton
                :label="props.confirmLabel"
                color="error"
                @click="resolve(true)"
            />
        </template>
    </UModal>
</template>
