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
/* Match syntax highlighting coloring from JSON Editor */
.jv-code {
    padding: 0 !important
}

.jv-container.jv-dark {
    background-color: #1e1e1e !important;
}

.jv-container.jv-dark .jv-key,
.jv-container.jv-dark .jv-item.jv-string .jv-link {
    color: #9cdcfe !important;
}

.jv-container.jv-dark .jv-item.jv-number {
    color: #b5cea8 !important;
}

.jv-container.jv-dark .jv-item.jv-string,
.jv-container.jv-dark .jv-item.jv-string .jv-link {
    color: #ce9178 !important;
}

.jv-container.jv-dark .jv-item.jv-undefined {
    color: #569cd6 !important;
}

.jv-container.jv-dark .jv-item.jv-array,
.jv-container.jv-dark .jv-item.jv-object,
.jv-node:after {
    color: #949494 !important;
}
</style>