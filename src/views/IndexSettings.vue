<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { Home } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import IndexTabMenu from '@/components/IndexTabMenu.vue';
import JsonEditorVue from 'json-editor-vue';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import type { Settings } from 'meilisearch';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import type { UseColorModeReturn } from '@vueuse/core';

const props = defineProps<{
    indexUID: string
}>();

const breadcrumbs = [
    { route: { name: 'dashboard' }, lucideIcon: Home },
    { label: 'Indexes', route: { name: 'indexes' } },
    { label: props.indexUID, route: { name: 'index-details', params: { indexUID: props.indexUID } } },
    { label: 'Settings', route: { name: 'index-settings', params: { indexUID: props.indexUID } } }
];

const colorMode = inject<UseColorModeReturn>('colorMode')!;
const jsonEditorDarkModeClass = computed(() => {
    return colorMode.value == 'dark' ? 'jse-theme-dark' : '';
});

const meiliStore = useMeilisearchStore();
const { currentIndex, currentIndexError } = storeToRefs(meiliStore);

await meiliStore.fetchCurrentIndex(props.indexUID);
const settings = ref<Settings | null>(null);
settings.value = await meiliStore.client?.index(props.indexUID).getSettings() || null;
</script>

<template>
    <AppLayout :breadcrumbs>
        <PageTitleSection>
            <template #title>
                <div class="flex items-center gap-4">
                    <span>Index: {{ props.indexUID }}</span>
                    <Tag
                        v-if="currentIndex?.primaryKey"
                        :value="`Primary Key: ${currentIndex.primaryKey}`"
                        severity="info"
                    />
                </div>
            </template>
        </PageTitleSection>

        <!-- Error State -->
        <!-- TOOD: make into component -->
        <Message
            v-if="currentIndexError"
            severity="error"
            :closable="false"
        >
            <span class="font-bold">Error loading index</span> {{ currentIndexError }}
        </Message>

        <IndexTabMenu
            current-route-name="index-settings"
            :indexUID="props.indexUID"
        />

        <Card>
            <template #content>
                <JsonEditorVue
                    v-model="settings"
                    :class="jsonEditorDarkModeClass"
                />
            </template>
        </Card>
    </AppLayout>
</template>