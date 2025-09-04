<script setup lang="ts">
import { computed, inject } from 'vue';
import type { UseColorModeReturn } from '@vueuse/core';
import JsonEditorVue from 'json-editor-vue';

// Dark/Light theme for JSON Editor
const prefersDarkColorScheme = () => {
    if (window && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
};
const colorMode = inject<UseColorModeReturn>('colorMode')!;
const jsonEditorDarkModeClass = computed(() => {
    let editorClass = '';
    if (colorMode.value === 'dark' || (prefersDarkColorScheme() && colorMode.value === 'auto')) {
        editorClass = 'jse-theme-dark';
    }
    return editorClass;
});
</script>

<template>
    <JsonEditorVue :class="jsonEditorDarkModeClass" />
</template>

<style>
@import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
</style>