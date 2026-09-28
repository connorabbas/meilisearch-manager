<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const props = defineProps<{
    indexUid: string,
}>()

const items = computed<NavigationMenuItem[]>(() => [{
    to: `/indexes/${props.indexUid}`,
    label: 'Stats',
    icon: 'i-lucide-chart-pie',
    exact: true,
}, {
    to: `/indexes/${props.indexUid}/documents`,
    label: 'Documents',
    icon: 'i-lucide-file-text',
}, {
    to: `/indexes/${props.indexUid}/settings`,
    label: 'Settings',
    icon: 'i-lucide-settings',
}, {
    to: `/indexes/${props.indexUid}/edit`,
    label: 'Edit',
    icon: 'i-lucide-pencil',
}])
</script>

<template>
    <UNavigationMenu
        :items="items"
        highlight
        class="min-w-max"
    />
</template>
