<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { useRouter } from 'vue-router';
import { RefreshCw, Trash2 } from 'lucide-vue-next';
import Card from 'primevue/card';
import Button from 'primevue/button';

const props = defineProps<{
    indexUID: string;
}>();

const router = useRouter();
const meiliStore = useMeilisearchStore();
const { currentIndex, serverStats, isLoading } = storeToRefs(meiliStore);

const fetchData = async () => {
    await meiliStore.fetchCurrentIndex(props.indexUID);
    await meiliStore.fetchStats();
};

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

const canTeleport = ref(false);
onMounted(async () => {
    await nextTick();
    canTeleport.value = !!document.querySelector('#index-page-actions');
});
</script>

<template>
    <div>
        <Teleport
            to="#index-page-actions"
            v-if="canTeleport && currentIndex"
        >
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
        </Teleport>
        <div
            v-if="currentIndex && indexStats"
            class="grid grid-cols-12 items-stretch gap-4"
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
    </div>
</template>