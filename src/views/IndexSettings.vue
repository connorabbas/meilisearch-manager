<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import { useSettings } from '../composables/meilisearch/useSettings';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import { useToast } from 'primevue';
import type { UseColorModeReturn } from '@vueuse/core';
import { AlertCircle, CircleQuestionMark, Pencil, X } from 'lucide-vue-next';

import JsonEditorVue from 'json-editor-vue';
import { Mode } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';

const props = defineProps<{
    indexUID: string
}>();

const toast = useToast();
const { settings, isLoading, error, fetchSettings, updateSettings } = useSettings();

await fetchSettings(props.indexUID);

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

const editMode = ref(false);
const toggleEditMode = () => {
    editMode.value = !editMode.value;
};

async function handleUpdateSettings() {
    if (!settings.value) {
        return;
    }
    try {
        const jsonString = JSON.stringify(settings.value);
        JSON.parse(jsonString);
    } catch (err) {
        error.value = 'Please correct the invalid JSON within the editor.';
        console.error("Error parsing JSON:", err);
        return;
    }

    updateSettings(props.indexUID, settings.value).then(() => {
        editMode.value = false;
    });
}
</script>

<template>
    <div>
        <Card>
            <template #title>
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <span>JSON Index Configuration</span>
                        <a
                            href="https://www.meilisearch.com/docs/reference/api/settings"
                            target="_blank"
                            class="text-inherit"
                        >
                            <CircleQuestionMark class="size-5!" />
                        </a>
                    </div>
                    <div>
                        <Button
                            v-if="!editMode"
                            v-tooltip.top="'Toggle Edit Mode'"
                            label="Edit"
                            severity="secondary"
                            @click="toggleEditMode"
                        >
                            <template #icon>
                                <Pencil />
                            </template>
                        </Button>
                        <div
                            v-else
                            class="flex gap-4"
                        >
                            <Button
                                label="Cancel"
                                severity="secondary"
                                @click="toggleEditMode"
                            >
                                <template #icon>
                                    <X />
                                </template>
                            </Button>
                            <Button
                                label="Save"
                                :loading="isLoading"
                                @click="handleUpdateSettings"
                            />
                        </div>
                    </div>
                </div>
            </template>
            <template #content>
                <Message
                    v-if="error"
                    class="mb-4"
                    severity="error"
                >
                    <template #icon>
                        <AlertCircle class="size-5!" />
                    </template>
                    {{ error }}
                </Message>
                <JsonEditorVue
                    v-model="settings"
                    :read-only="!editMode"
                    :mode="Mode.text"
                    :stringified="false"
                    :class="jsonEditorDarkModeClass"
                />
            </template>
        </Card>
    </div>
</template>