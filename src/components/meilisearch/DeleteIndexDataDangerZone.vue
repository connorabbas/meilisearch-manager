<script setup lang="ts">
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useRouter } from 'vue-router';

const props = defineProps<{
    indexUID: string,
}>();

const router = useRouter();
const { confirmDeleteIndex } = useIndexes();

function handleDeleteIndex() {
    confirmDeleteIndex(props.indexUID, () => {
        router.push({ name: 'dashboard' });
    });
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
                    <!-- TODO -->
                    <!-- <Button
                                label="Delete all documents"
                                severity="danger"
                            /> -->
                </div>
            </div>
        </Message>
    </div>
</template>