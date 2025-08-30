<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import { useMeilisearchStore } from '@/stores/meilisearch';
import Button from 'primevue/button';
import Card from 'primevue/card';
import type { Settings } from 'meilisearch';
import type { UseColorModeReturn } from '@vueuse/core';
import { CircleQuestionMark, Pencil, Save, X } from 'lucide-vue-next';

import JsonEditorVue from 'json-editor-vue';
import { Mode } from 'vanilla-jsoneditor';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';

const props = defineProps<{
    indexUID: string
}>();

const colorMode = inject<UseColorModeReturn>('colorMode')!;
const jsonEditorDarkModeClass = computed(() => {
    return colorMode.value == 'dark' ? 'jse-theme-dark' : '';
});

const meiliStore = useMeilisearchStore();
const settings = ref<Settings | null>(null);
settings.value = await meiliStore.client?.index(props.indexUID).getSettings() || null;

// TODO: toggle edit mode
const editMode = ref(false);
const toggleEditMode = () => {
    editMode.value = !editMode.value;
};
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
                                severity="success"
                            >
                                <template #icon>
                                    <Save />
                                </template>
                            </Button>
                        </div>
                    </div>
                </div>
            </template>
            <template #content>
                <JsonEditorVue
                    v-model="settings"
                    :read-only="!editMode"
                    :mode="Mode.text"
                    :class="jsonEditorDarkModeClass"
                />
            </template>
        </Card>
    </div>
</template>