<script setup lang="ts">
import { AlertCircle } from '@lucide/vue'
import 'vue3-json-viewer/dist/vue3-json-viewer.css'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

const route = useRoute()

useHead(() => ({
    title: route.meta.title as string | undefined,
    titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} - Meilisearch Manager` : 'Meilisearch Manager',
}))
</script>

<template>
    <UApp>
        <AppToast />
        <ConfirmDialog
            group="delete"
            :draggable="false"
            blockScroll
        >
            <template #icon>
                <AlertCircle />
            </template>
        </ConfirmDialog>
        <NuxtLoadingIndicator color="var(--ui-primary)" />
        <NuxtLayout>
            <NuxtRouteAnnouncer />
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>
