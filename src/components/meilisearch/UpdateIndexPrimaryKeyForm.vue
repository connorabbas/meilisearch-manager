<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import type { Index } from 'meilisearch';
import InputErrors from '@/components/InputErrors.vue';

const props = defineProps<{
    indexUid: string,
    index: Index,
}>();

const emit = defineEmits(['refetch-index']);

const { error, isSendingTask, updateIndex } = useIndexes();

const primaryKey = ref(props.index.primaryKey ?? '');
const inputErrors = computed(() => error.value ? [error.value] : []);

function handleUpdatePrimaryKey() {
    updateIndex(props.indexUid, primaryKey.value).then(() => {
        emit('refetch-index');
    });
}

</script>

<template>
    <form
        class="space-y-6"
        @submit.prevent="handleUpdatePrimaryKey"
    >
        <div class="flex flex-col gap-2">
            <InputText
                id="name"
                v-model="primaryKey"
                type="text"
                :invalid="Boolean(error)"
                required
                fluid
            />
            <InputErrors
                v-if="Boolean(error)"
                :errors="inputErrors"
            />
        </div>
        <div class="text-xs text-muted-color">
            You can freely update the primary key of an index as long as it contains no documents. To change
            the primary key of an index that already contains documents, you must first delete all documents
            in that index. You may then change the primary key and index your dataset again.
        </div>
        <div class="flex items-center gap-3">
            <Button
                type="submit"
                label="Save"
                :disabled="!primaryKey"
                :loading="isSendingTask"
            />
        </div>
    </form>
</template>