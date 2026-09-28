<script setup lang="ts">
import JsonEditorVue from 'json-editor-vue'

const colorMode = useColorMode()
const jsonEditorDarkModeClass = computed(() => colorMode.value === 'dark' ? 'jse-theme-dark' : '')
</script>

<template>
    <JsonEditorVue :class="jsonEditorDarkModeClass" />
</template>
