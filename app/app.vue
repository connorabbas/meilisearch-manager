<script setup lang="ts">
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
        <NuxtLoadingIndicator color="var(--ui-primary)" />
        <NuxtLayout>
            <NuxtRouteAnnouncer />
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>
