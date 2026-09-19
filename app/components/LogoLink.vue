<script setup lang="ts">
const props = defineProps<{
    imgClasses?: string,
}>()
</script>

<template>
    <NuxtLink
        to="/"
        aria-label="Meilisearch Manager home"
        class="flex items-center justify-start rounded-md"
    >
        <img
            :class="['block h-6 w-auto', props.imgClasses]"
            src="/meili-logo.svg"
            alt=""
        >
    </NuxtLink>
</template>
