<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const route = useRoute()
const scrollContainer = shallowRef<HTMLElement | null>(null)
const showScrollTop = ref(false)
const props = defineProps<{
    id: string,
    breadcrumbs?: BreadcrumbItem[],
}>()
const breadcrumbs = computed(() => props.breadcrumbs ?? route.meta.breadcrumbs as BreadcrumbItem[] | undefined)

function updateScrollTopVisibility() {
    showScrollTop.value = (scrollContainer.value?.scrollTop ?? 0) > 200
}

function scrollToTop() {
    scrollContainer.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
    scrollContainer.value = document.querySelector<HTMLElement>('.app-scroll-container')
    scrollContainer.value?.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
})

onUnmounted(() => {
    scrollContainer.value?.removeEventListener('scroll', updateScrollTopVisibility)
})
</script>

<template>
    <UDashboardPanel
        :id="id"
        :ui="{ root: 'h-full min-h-0', body: 'min-h-0 app-scroll-container' }"
    >
        <template #header>
            <UDashboardNavbar>
                <template #left>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb
                        v-if="breadcrumbs?.length"
                        :items="breadcrumbs"
                        color="neutral"
                    />
                </template>

                <template
                    v-if="$slots.actions"
                    #right
                >
                    <slot name="actions" />
                </template>
            </UDashboardNavbar>

            <slot name="toolbar" />
        </template>

        <template #body>
            <slot />
        </template>
    </UDashboardPanel>

    <UButton
        v-if="showScrollTop"
        aria-label="Scroll to top"
        icon="i-lucide-arrow-up"
        color="primary"
        class="fixed end-4 bottom-4 z-50 rounded-full shadow-lg sm:end-6 sm:bottom-6"
        @click="scrollToTop"
    />
</template>
