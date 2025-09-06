<script setup lang="ts">
import { useDocuments } from '@/composables/meilisearch/useDocuments';
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import { useRouter } from 'vue-router';

const props = defineProps<{
    indexUid: string,
}>();

const router = useRouter();
const { confirmDeleteIndex } = useIndexes();
const { confirmDeleteAllDocuments } = useDocuments();

function handleDeleteIndex() {
    confirmDeleteIndex(props.indexUid, () => {
        router.push({ name: 'dashboard' });
    });
}
function handleDeleteAllDocuments() {
    confirmDeleteAllDocuments(props.indexUid);
}
</script>

<template>
    <div>
        <Message
            severity="error"
            pt:root:class="p-2"
        >
            <div class="flex flex-col gap-4">
                <div>
                    <div class="text-lg">
                        Warning
                    </div>
                    <div>
                        Please proceed with caution, this cannot be undone.
                    </div>
                </div>
                <div class="flex gap-4">
                    <Button
                        label="Delete this index"
                        severity="danger"
                        @click="handleDeleteIndex"
                    />
                    <!-- TODO: maybe move to documents tab? -->
                    <Button
                        label="Delete all documents"
                        severity="danger"
                        @click="handleDeleteAllDocuments"
                    />
                </div>
            </div>
        </Message>
    </div>
</template>