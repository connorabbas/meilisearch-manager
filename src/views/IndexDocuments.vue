<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { Home } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import IndexTabMenu from '@/components/IndexTabMenu.vue';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Tag from 'primevue/tag';

const props = defineProps<{
    indexUID: string
}>();

const breadcrumbs = [
    { route: { name: 'dashboard' }, lucideIcon: Home },
    { label: 'Indexes', route: { name: 'indexes' } },
    { label: props.indexUID, route: { name: 'index-details', params: { indexUID: props.indexUID } } },
    { label: 'Documents', route: { name: 'index-documents', params: { indexUID: props.indexUID } } }
];

const meiliStore = useMeilisearchStore();
const { currentIndex, currentIndexError } = storeToRefs(meiliStore);

await meiliStore.fetchCurrentIndex(props.indexUID);
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
            current-route-name="index-documents"
            :indexUID="props.indexUID"
        />

        <Card v-if="currentIndex">
            <template #content>
                Documents
            </template>
        </Card>
    </AppLayout>
</template>