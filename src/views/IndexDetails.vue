<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useRouter } from 'vue-router';
import { RefreshCw, Trash2, Home } from 'lucide-vue-next';
import AppLayout from '@/layouts/AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import IndexTabMenu from '@/components/IndexTabMenu.vue';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

const props = defineProps<{
    indexUID: string
}>();

const breadcrumbs = [
    { route: { name: 'dashboard' }, lucideIcon: Home },
    { label: 'Indexes', route: { name: 'indexes' } },
    { label: props.indexUID, route: { name: 'index-details', params: { indexUID: props.indexUID } } },
];

const router = useRouter();
const meiliStore = useMeilisearchStore();
const { currentIndex, currentIndexError, serverStats, isLoading } = storeToRefs(meiliStore);

const fetchData = async () => {
    await meiliStore.fetchCurrentIndex(props.indexUID);
    await meiliStore.fetchStats();
};
fetchData();

const indexStats = computed(() => {
    if (!serverStats.value || !currentIndex.value) return null;
    return serverStats.value.indexes[currentIndex.value.uid];
});

// TODO: abstract to utils
const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// TODO: abstract to utils
const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// TODO: abstract
const handleDelete = async () => {
    if (confirm(`Delete index "${props.indexUID}"?`)) {
        await meiliStore.deleteIndex(props.indexUID);
        router.push('/indexes');
    }
};
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
            <template #end>
                <div class="flex gap-4">
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
                    <Button
                        v-if="currentIndex"
                        label="Delete Index"
                        severity="danger"
                        outlined
                        @click="handleDelete"
                    >
                        <template #icon>
                            <Trash2 />
                        </template>
                    </Button>
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
            current-route-name="index-details"
            :indexUID="props.indexUID"
        />

        <div
            v-if="currentIndex && indexStats"
            class="grid grid-cols-12 items-stretch gap-4 mb-4"
        >
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <Card class="h-full">
                    <template #content>
                        <div class="text-muted-color text-sm">
                            Documents
                        </div>
                        <div class="text-2xl font-semibold">
                            {{ indexStats.numberOfDocuments?.toLocaleString() || 0 }}
                        </div>
                    </template>
                </Card>
            </div>
            <div class="col-span-12 sm:col-span-6 lg:col-span-3">
                <Card class="h-full">
                    <template #content>
                        <div class="text-muted-color text-sm">
                            Index Size
                        </div>
                        <div class="text-2xl font-semibold">
                            {{ formatBytes(indexStats.rawDocumentDbSize || 0) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="currentIndex.updatedAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #content>
                        <div class="text-muted-color text-sm">
                            Last Updated
                        </div>
                        <div class="text-xl font-semibold">
                            {{ formatDate(currentIndex.updatedAt) }}
                        </div>
                    </template>
                </Card>
            </div>
            <div
                v-if="currentIndex.createdAt"
                class="col-span-12 sm:col-span-6 lg:col-span-3"
            >
                <Card class="h-full">
                    <template #content>
                        <div class="text-muted-color text-sm">
                            Created
                        </div>
                        <div class="text-xl font-semibold">
                            {{ formatDate(currentIndex.createdAt) }}
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- TODO: make into component -->
        <Card v-else>
            <template #content>
                <div class="text-center p-4">
                    <p>No index data available</p>
                    <Button
                        label="Go Back"
                        class="mt-3"
                        @click="router.back()"
                    />
                </div>
            </template>
        </Card>
    </AppLayout>
</template>