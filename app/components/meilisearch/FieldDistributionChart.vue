<script setup lang="ts">
import Chart from 'chart.js/auto'
import type { ChartConfiguration } from 'chart.js'

const props = defineProps<{
    fieldDistribution: Record<string, number> | null | undefined
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const canvas = useTemplateRef('canvas')
const chart = shallowRef<Chart | null>(null)

const chartColors = [
    '--color-cyan-500',
    '--color-orange-500',
    '--color-purple-500',
    '--color-green-500',
    '--color-pink-500',
    '--color-blue-500',
    '--color-amber-500',
    '--color-red-500',
    '--color-teal-500',
    '--color-indigo-500',
    '--color-lime-500',
    '--color-yellow-500',
    '--color-fuchsia-500',
    '--color-rose-500',
    '--color-sky-500',
    '--color-violet-500',
    '--color-emerald-500',
    '--color-gray-500',
]

const chartHoverColors = [
    '--color-cyan-400',
    '--color-orange-400',
    '--color-purple-400',
    '--color-green-400',
    '--color-pink-400',
    '--color-blue-400',
    '--color-amber-400',
    '--color-red-400',
    '--color-teal-400',
    '--color-indigo-400',
    '--color-lime-400',
    '--color-yellow-400',
    '--color-fuchsia-400',
    '--color-rose-400',
    '--color-sky-400',
    '--color-violet-400',
    '--color-emerald-400',
    '--color-gray-400',
]

function resolveVars(vars: string[]): string[] {
    const style = getComputedStyle(document.documentElement)
    return vars.map(v => style.getPropertyValue(v).trim() || '#000000')
}

const fields = computed(() => Object.keys(props.fieldDistribution ?? {}))
const hasData = computed(() => fields.value.length > 0)

async function renderChart() {
    chart.value?.destroy()
    chart.value = null

    if (!hasData.value) return

    await nextTick()
    if (!canvas.value) return

    const counts = fields.value.map(field => props.fieldDistribution?.[field] ?? 0)
    const bg = resolveVars(chartColors)
    const hover = resolveVars(chartHoverColors)
    const style = getComputedStyle(document.documentElement)
    const textColor = style.getPropertyValue('--ui-text-muted').trim() || (isDark.value ? '#e5e7eb' : '#374151')
    const borderColor = style.getPropertyValue('--ui-border').trim() || (isDark.value ? '#374151' : '#e5e7eb')
    const config: ChartConfiguration<'doughnut'> = {
        type: 'doughnut',
        data: {
            labels: fields.value,
            datasets: [
                {
                    data: counts,
                    backgroundColor: fields.value.map((_, i) => bg[i % bg.length]),
                    hoverBackgroundColor: fields.value.map((_, i) => hover[i % hover.length]),
                    borderColor,
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        color: textColor,
                        boxWidth: 10,
                        padding: 15,
                    },
                },
            },
            cutout: '60%',
        },
    }

    chart.value = new Chart(canvas.value, config)
}

watch([() => props.fieldDistribution, isDark], () => {
    void renderChart()
}, { deep: true })

onMounted(() => {
    void renderChart()
})

onBeforeUnmount(() => {
    chart.value?.destroy()
})
</script>

<template>
    <div
        v-if="hasData"
        class="flex justify-center"
    >
        <canvas
            ref="canvas"
            aria-label="Field distribution chart"
            role="img"
            class="h-96 w-full"
        />
    </div>
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
