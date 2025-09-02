<script setup lang="ts">
import Card from 'primevue/card';
import type { Index } from 'meilisearch';
import DeleteIndexDataDangerZone from '@/components/meilisearch/DeleteIndexDataDangerZone.vue';
import UpdateIndexPrimaryKeyForm from '@/components/meilisearch/UpdateIndexPrimaryKeyForm.vue';

const props = defineProps<{
    indexUID: string,
    index: Index,
}>();

const emit = defineEmits(['refetch-index']);
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-8 md:max-w-2xl">
        <Card
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Primary Key
            </template>
            <template #content>
                <UpdateIndexPrimaryKeyForm
                    :indexUID="props.indexUID"
                    :index="props.index"
                    @refetch-index="$emit('refetch-index')"
                />
            </template>
        </Card>
        <Card
            pt:body:class="max-w-2xl space-y-3"
            pt:caption:class="space-y-1"
        >
            <template #title>
                Delete
            </template>
            <template #content>
                <DeleteIndexDataDangerZone :indexUID="props.indexUID" />
            </template>
        </Card>
    </div>
</template>