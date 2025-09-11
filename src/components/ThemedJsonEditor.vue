<script setup lang="ts">
import { computed, inject } from 'vue';
import type { UseColorModeReturn } from '@vueuse/core';
import JsonEditorVue from 'json-editor-vue';
import { prefersDarkColorScheme } from '@/utils';

const colorMode = inject<UseColorModeReturn>('colorMode')!;
const jsonEditorDarkModeClass = computed(() => {
    return (colorMode.value === 'dark' || (prefersDarkColorScheme() && colorMode.value === 'auto'))
        ? 'jse-theme-dark'
        : '';
});
</script>

<template>
    <JsonEditorVue :class="jsonEditorDarkModeClass" />
</template>

<style>
@import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
</style>