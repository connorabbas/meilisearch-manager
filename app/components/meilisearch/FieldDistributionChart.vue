<script setup lang="ts">
import Chart from 'primevue/chart'

const props = defineProps<{
    fieldDistribution: Record<string, number> | null | undefined
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

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

const chartData = ref<any>(null)

function buildChartData() {
    if (!props.fieldDistribution) {
        chartData.value = null
        return
    }

    const fields = Object.keys(props.fieldDistribution)
    if (fields.length === 0) {
        chartData.value = null
        return
    }

    const counts = Object.values(props.fieldDistribution)
    const bg = resolveVars(chartColors)
    const hover = resolveVars(chartHoverColors)

    chartData.value = {
        labels: fields,
        datasets: [
            {
                data: counts,
                backgroundColor: fields.map((_, i) => bg[i % bg.length]),
                hoverBackgroundColor: fields.map((_, i) => hover[i % hover.length]),
                borderColor: isDark.value ? '#374151' : '#e5e7eb',
                borderWidth: 2,
            },
        ],
    }
}

const chartOptions = computed(() => {
    const textColor = isDark.value ? '#e5e7eb' : '#374151'

    return {
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
    }
})

watch(() => props.fieldDistribution, buildChartData, { immediate: false })

watch(isDark, buildChartData, { flush: 'sync' })

onMounted(() => {
    buildChartData()
})
</script>

<template>
    <div
        v-if="chartData"
        class="flex justify-center"
    >
        <Chart
            :key="isDark ? 'dark' : 'light'"
            type="doughnut"
            :data="chartData"
            :options="chartOptions"
            class="w-full h-96"
        />
    </div>
    <div
        v-else
        class="flex flex-col items-center justify-center h-64 text-muted-color"
    >
        <i class="pi pi-chart-pie size-12 mb-2 opacity-50" />
        <p>No field distribution data available</p>
    </div>
</template>
