<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
    layout: 'app',
    title: 'Backups',
})

const route = useRoute()
if (route.path === '/backups') {
    await navigateTo('/backups/dumps', { replace: true })
}

const links = [{
    label: 'Dumps',
    to: '/backups/dumps',
    icon: 'lucide-hard-drive-download',
    exact: true
}, {
    label: 'Snapshots',
    to: '/backups/snapshots',
    icon: 'lucide-aperture'
}] satisfies NavigationMenuItem[]
</script>

<template>
    <AppDashboardPanel id="backups">
        <template #actions>
            <div
                id="sub-page-actions"
                class="contents"
            />
        </template>

        <template #toolbar>
            <UDashboardToolbar>
                <UNavigationMenu
                    :items="links"
                    highlight
                    class="-mx-1 flex-1"
                />
            </UDashboardToolbar>
        </template>

        <NuxtPage />

    </AppDashboardPanel>
</template>
