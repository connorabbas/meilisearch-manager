<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import IndexTabMenu from '@/components/meilisearch/IndexTabMenu.vue'

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Indexes', to: '/indexes' },
        { label: indexUid.value, to: `/indexes/${encodeURIComponent(indexUid.value)}` },
    ]

    if (route.path.endsWith('/documents')) items.push({ label: 'Documents' })
    else if (route.path.endsWith('/settings')) items.push({ label: 'Settings' })
    else if (route.path.endsWith('manage')) items.push({ label: 'Manage' })

    return items
})

definePageMeta({
    layout: 'app',
    dashboardPanel: true,
})
</script>

<template>
    <AppDashboardPanel
        id="index"
        :breadcrumbs="breadcrumbs"
    >
        <template #actions>
            <div
                id="sub-page-actions"
                class="contents"
            />
        </template>

        <template #toolbar>
            <UDashboardToolbar>
                <IndexTabMenu :index-uid="indexUid" />
            </UDashboardToolbar>
        </template>

        <NuxtPage />
    </AppDashboardPanel>
</template>
