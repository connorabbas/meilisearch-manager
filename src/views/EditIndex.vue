<script setup lang="ts">
import type { Index } from 'meilisearch';
import DeleteIndexDataDangerZone from '@/components/meilisearch/DeleteIndexDataDangerZone.vue';
import UpdateIndexPrimaryKeyForm from '@/components/meilisearch/UpdateIndexPrimaryKeyForm.vue';

const props = defineProps<{
    indexUid: string,
    index: Index,
}>();

defineEmits(['refetch-index']);
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
                    :indexUid="props.indexUid"
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
                <DeleteIndexDataDangerZone :indexUid="props.indexUid" />
            </template>
        </Card>
    </div>
</template>