<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMeilisearchStore } from '@/stores/meilisearch';
import Card from 'primevue/card';

const props = defineProps<{
    indexUID: string
}>();

const meiliStore = useMeilisearchStore();
const { currentIndex } = storeToRefs(meiliStore);
</script>

<template>
    <div>
        <Card>
            <template #content>
                Documents
            </template>
        </Card>
    </div>
</template>