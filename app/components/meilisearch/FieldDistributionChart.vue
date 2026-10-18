<script setup lang="ts">
const props = defineProps<{
    fieldDistribution: Record<string, number> | null | undefined
}>()

const data = computed(() => Object.entries(props.fieldDistribution ?? {}).map(([field, count]) => ({ field, count })))
</script>

<template>
    <UChart
        v-if="data.length"
        type="donut"
        :data="data"
        index="field"
        :categories="[{ key: 'count', label: 'Documents' }]"
        :height="384"
        :thickness="48"
        legend
        aria-label="Field distribution chart"
    />
    <div
        v-else
        class="flex h-64 flex-col items-center justify-center text-muted"
    >
        <UIcon
            name="i-lucide-chart-pie"
            class="mb-2 size-12 opacity-50"
        />
        <p>No field distribution data available</p>
    </div>
</template>
