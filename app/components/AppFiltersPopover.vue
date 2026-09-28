<script setup lang="ts">
const props = withDefaults(defineProps<{
    label?: string
    count?: number
    clearLabel?: string
}>(), {
    label: 'Filter',
    count: 0,
    clearLabel: 'Clear filters',
})

const emit = defineEmits<{
    clear: []
}>()
</script>

<template>
    <UPopover :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
        <UChip
            :text="String(props.count)"
            :show="props.count > 0"
            size="3xl"
            :ui="{ base: 'h-5 min-w-5 px-1.5 text-xs' }"
        >
            <UButton
                :label="props.label"
                icon="i-lucide-funnel"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="outline"
            />
        </UChip>

        <template #content>
            <div class="flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-4 p-4">
                <slot />

                <template v-if="props.count > 0">
                    <USeparator />
                    <UButton
                        :label="props.clearLabel"
                        icon="i-lucide-funnel-x"
                        color="neutral"
                        variant="soft"
                        block
                        @click="emit('clear')"
                    />
                </template>
            </div>
        </template>
    </UPopover>
</template>
