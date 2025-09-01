<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useMeilisearchIndexesStore } from '@/stores/meilisearchIndexes';
import { useRoute } from 'vue-router';
import { Home, RefreshCw } from 'lucide-vue-next';
import AppLayout from './AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import IndexTabMenu from '@/components/IndexTabMenu.vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import type { MenuItem } from '@/types';

const props = defineProps<{
    indexUID: string;
}>();

const route = useRoute();
const meiliStore = useMeilisearchStore();
const meilisearchIndexesStore = useMeilisearchIndexesStore();
const { currentIndex, currentIndexError, isLoading } = storeToRefs(meilisearchIndexesStore);

const fetchData = async () => {
    await meilisearchIndexesStore.fetchCurrentIndex(props.indexUID);
    await meiliStore.fetchStats();
};

const breadcrumbs = computed(() => {
    const dynamicBreadcrumbs: MenuItem[] = [
        { route: { name: 'dashboard' }, lucideIcon: Home },
        { label: 'Indexes', route: { name: 'indexes' } },
        { label: props.indexUID, route: { name: 'index-details', params: { indexUID: props.indexUID } } },
    ];
    if (route.meta.breadcrumbLabel) {
        const breadcrumbLabel = route.meta.breadcrumbLabel as string;
        dynamicBreadcrumbs.push({ label: breadcrumbLabel });
    }

    return dynamicBreadcrumbs;
});

const currentRouteName = computed(() => route.name as string);

watch(() => props.indexUID, () => {
    meilisearchIndexesStore.fetchCurrentIndex(props.indexUID);
});

onMounted(async () => {
    fetchData();
});
</script>

<template>
    <AppLayout :breadcrumbs>
        <PageTitleSection>
            <template #title>
                <div class="flex items-center gap-4">
                    <span>Index: {{ indexUID }}</span>
                    <Tag
                        v-if="currentIndex?.primaryKey"
                        :value="`Primary Key: ${currentIndex.primaryKey}`"
                        severity="info"
                    />
                </div>
            </template>
            <template #end>
                <div
                    v-if="route.meta?.breadcrumbLabel === 'Details'"
                    class="flex gap-4"
                >
                    <Button
                        label="Refresh"
                        severity="secondary"
                        :loading="isLoading"
                        @click="fetchData"
                    >
                        <template #icon>
                            <RefreshCw />
                        </template>
                    </Button>
                </div>
            </template>
        </PageTitleSection>

        <!-- Error State -->
        <Message
            v-if="currentIndexError"
            severity="error"
            :closable="false"
        >
            <span class="font-bold">Error loading index:</span> {{ currentIndexError }}
        </Message>

        <!-- Tab Navigation -->
        <IndexTabMenu
            :current-route-name="currentRouteName"
            :indexUID="indexUID"
        />

        <!-- Content slot for child components -->
        <router-view
            v-if="currentIndex"
            v-slot="{ Component }"
        >
            <component
                :is="Component"
                :index="currentIndex"
            />
        </router-view>

        <!-- Loading state -->
        <Card v-else-if="isLoading">
            <template #content>
                <div class="text-center p-4">
                    Loading index data...
                </div>
            </template>
        </Card>
    </AppLayout>
</template>