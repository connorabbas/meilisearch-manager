<script setup lang="ts">
import { computed, inject } from 'vue';
import type { UseColorModeReturn } from '@vueuse/core';
import { JsonViewer } from "vue3-json-viewer";
import { prefersDarkColorScheme } from '@/utils';

const props = defineProps<{
    data: object,
}>();

const colorMode = inject<UseColorModeReturn>('colorMode')!;
const theme = computed(() => {
    return (colorMode.value === 'dark' || (prefersDarkColorScheme() && colorMode.value === 'auto')) ? 'dark' : 'light';
});
</script>

<template>
    <JsonViewer
        :value="props.data"
        :theme="theme"
    />
</template>

<style>
@import 'vue3-json-viewer/dist/vue3-json-viewer.css';

.jv-code {
    padding: 0 !important
}
</style>