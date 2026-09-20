<script setup lang="ts">
const props = withDefaults(defineProps<{
    label?: string
    tooltip?: string
}>(), {
    label: 'Poll',
    tooltip: 'Poll every 5 seconds',
})

const model = defineModel<boolean>({ default: true })
</script>

<template>
    <UTooltip
        :text="props.tooltip"
        :content="{ side: 'top' }"
    >
        <div class="flex items-center gap-3">
            <USwitch v-model="model">
                <template #label>
                    <span class="flex items-center gap-2.5">
                        <span>{{ props.label }}</span>
                        <span
                            v-if="model"
                            class="relative flex h-3 w-3"
                        >
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                            <span class="relative inline-flex h-3 w-3 rounded-full bg-success-400" />
                        </span>
                    </span>
                </template>
            </USwitch>
        </div>
    </UTooltip>
</template>