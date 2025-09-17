<script setup lang="ts">
import { ref, toRaw, watch } from 'vue';
import { useSettings } from '../composables/meilisearch/useSettings';
import { AlertCircle, CircleQuestionMark, Pencil, X } from 'lucide-vue-next';
import { Mode } from 'vanilla-jsoneditor';
import ThemedJsonEditor from '@/components/ThemedJsonEditor.vue';

const props = defineProps<{
    indexUid: string
}>();

const { settings, isLoadingTask, fetchSettings, updateSettings } = useSettings();

await fetchSettings(props.indexUid);

const originalSettings = structuredClone(toRaw(settings.value));
const editMode = ref(false);
const toggleEditMode = () => {
    // if edit is canceled, reset to original value
    if (editMode.value) {
        console.log('editing', originalSettings);
        settings.value = originalSettings;
    }
    editMode.value = !editMode.value;
};

const invalidJsonMessage = 'Please correct the invalid settings JSON.';
const jsonError = ref('');
async function handleUpdateSettings() {
    if (!settings.value) {
        return;
    }
    try {
        const jsonString = JSON.stringify(settings.value);
        JSON.parse(jsonString);
    } catch (err) {
        jsonError.value = invalidJsonMessage;
        console.error("Error parsing JSON:", err);
        return;
    }

    updateSettings(props.indexUid, settings.value).then(() => {
        editMode.value = false;
        fetchSettings(props.indexUid);
    });
}
watch(() => settings.value, (newVal) => {
    jsonError.value = (newVal === undefined) ? invalidJsonMessage : '';
});
</script>

<template>
    <div>
        <Card>
            <template #title>
                <div class="flex justify-between items-center mb-3">
                    <div class="flex items-center gap-3">
                        <span>JSON Index Configuration</span>
                        <a
                            href="https://www.meilisearch.com/docs/reference/api/settings#settings-object"
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
                                :loading="isLoadingTask"
                                @click="handleUpdateSettings"
                            />
                        </div>
                    </div>
                </div>
            </template>
            <template #content>
                <Message
                    v-if="jsonError"
                    class="mb-4"
                    severity="error"
                >
                    <template #icon>
                        <AlertCircle />
                    </template>
                    {{ jsonError }}
                </Message>
                <ThemedJsonEditor
                    v-model="settings"
                    :read-only="!editMode"
                    :mode="Mode.text"
                    :main-menu-bar="false"
                    :stringified="false"
                />
            </template>
        </Card>
    </div>
</template>