<script setup lang="ts">
import type { Settings } from 'meilisearch'
import { Mode } from 'vanilla-jsoneditor'
import { useSettings } from '@/composables/meilisearch/useSettings'

const settingsDocsUrl = 'https://www.meilisearch.com/docs/reference/api/settings/list-all-settings'
const updateSettingsDocsUrl = 'https://www.meilisearch.com/docs/reference/api/settings/update-all-settings'

definePageMeta({
    layout: 'app',
    title: 'Index Settings',
})

const route = useRoute()
const indexUid = computed(() => String(route.params.uid ?? ''))
const { settings, isFetching, isLoadingTask, error, fetchSettings, updateSettings } = useSettings()
const originalSettings = shallowRef<Settings | null>(null)
const editMode = ref(false)
const invalidJsonMessage = 'Please correct the invalid settings JSON.'
const jsonError = ref('')

function cloneSettings(value: Settings) {
    return structuredClone(toRaw(value))
}

async function loadSettings() {
    const loadedSettings = await fetchSettings(indexUid.value)
    if (!loadedSettings) return

    settings.value = cloneSettings(loadedSettings)
    originalSettings.value = cloneSettings(loadedSettings)
    jsonError.value = ''
}

function startEditing() {
    if (!settings.value) return

    originalSettings.value = cloneSettings(settings.value)
    editMode.value = true
}

function cancelEditing() {
    if (originalSettings.value) settings.value = cloneSettings(originalSettings.value)
    jsonError.value = ''
    editMode.value = false
}

async function handleUpdateSettings() {
    if (!settings.value || jsonError.value) return

    try {
        JSON.parse(JSON.stringify(settings.value))
    } catch {
        jsonError.value = invalidJsonMessage
        return
    }

    try {
        await updateSettings(indexUid.value, settings.value)
        await loadSettings()
        editMode.value = false
    } catch {
        // The composable exposes failures inline and through a toast.
    }
}

watch(settings, value => {
    jsonError.value = value === undefined ? invalidJsonMessage : ''
})

watch(indexUid, () => {
    editMode.value = false
    void loadSettings()
}, { immediate: true })
</script>

<template>
    <div class="w-full space-y-4 md:space-y-6">
        <Teleport to="#sub-page-actions">
            <AppPageActions>
                <UButton
                    v-if="!editMode"
                    label="Edit"
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="outline"
                    :disabled="isFetching.allSettings || !settings"
                    @click="startEditing"
                />
                <template v-else>
                    <UButton
                        label="Cancel"
                        icon="i-lucide-x"
                        color="neutral"
                        variant="outline"
                        :disabled="isLoadingTask"
                        @click="cancelEditing"
                    />
                    <UButton
                        label="Save"
                        icon="i-lucide-save"
                        :loading="isLoadingTask"
                        :disabled="Boolean(jsonError)"
                        @click="handleUpdateSettings"
                    />
                </template>
            </AppPageActions>
        </Teleport>

        <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-x"
            title="Unable to load index settings"
            :description="error"
            :actions="[{ label: 'Retry', onClick: loadSettings }]"
        />

        <UCard
            title="JSON Index Configuration"
            variant="subtle"
        >
            <template #description>
                <UButton
                    label="Review the complete index settings as JSON."
                    :href="settingsDocsUrl"
                    target="_blank"
                    aria-label="Open index settings documentation"
                    trailing-icon="i-lucide-arrow-up-right"
                    color="neutral"
                    variant="link"
                    class="p-0"
                    :ui="{ trailingIcon: 'size-3 text-dimmed' }"
                />
            </template>

            <div
                v-if="isFetching.allSettings && !settings"
                aria-label="Loading index settings"
                class="space-y-3"
            >
                <USkeleton class="h-8 w-1/3" />
                <USkeleton class="h-96 w-full" />
            </div>

            <template v-else-if="settings">
                <UAlert
                    v-if="editMode"
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-triangle-alert"
                    title="Updating settings can be long-running"
                    :description="'Changes to searchable, filterable, sortable, ranking, tokenization, language, or embedder settings can reprocess documents or regenerate embeddings.'"
                    class="mb-4"
                >
                    <template #description>
                        Changes to searchable, filterable, sortable, ranking, tokenization, language, or embedder
                        settings can reprocess documents or regenerate embeddings. Reference the
                        <UButton
                            :href="updateSettingsDocsUrl"
                            target="_blank"
                            label="settings documentation"
                            trailing-icon="i-lucide-arrow-up-right"
                            color="warning"
                            variant="link"
                            class="p-0 align-baseline"
                            :ui="{ trailingIcon: 'size-3' }"
                        /> for more information.
                    </template>
                </UAlert>

                <UAlert
                    v-if="jsonError"
                    color="error"
                    variant="subtle"
                    icon="i-lucide-circle-x"
                    title="Invalid settings JSON"
                    :description="jsonError"
                    class="mb-4"
                />

                <ThemedJsonEditor
                    v-model="settings"
                    :read-only="!editMode"
                    :mode="Mode.text"
                    :main-menu-bar="false"
                    :stringified="false"
                />
            </template>

            <UAlert
                v-else-if="!error"
                color="neutral"
                variant="subtle"
                icon="i-lucide-settings"
                title="No settings available"
                description="Refresh the page to request settings for this index."
            />
        </UCard>
    </div>
</template>
