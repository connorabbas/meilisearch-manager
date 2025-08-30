<script setup lang="ts">
import Container from '@/components/Container.vue';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { AlertCircle, RefreshCcw } from 'lucide-vue-next';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const meiliStore = useMeilisearchStore();

const error = computed(() => {
    return meiliStore.connectionError || 'Unable to connect to to the configured Meilisearch instance...';
});

const retryConnection = async () => {
    await meiliStore.connect();
    if (meiliStore.isConnected) {
        router.push({ name: 'indexes' });
    }
};
</script>

<template>
    <Container fluid>
        <main>
            <div class="h-screen flex items-center justify-center">
                <Card class="p-4 sm:p-8">
                    <template #content>
                        <div class="flex flex-col gap-6 md:gap-8 items-center justify-center text-center">
                            <h1 class="font-extrabold text-primary text-4xl">
                                Connection Error
                            </h1>
                            <Message severity="error">
                                <template #icon>
                                    <AlertCircle />
                                </template>
                                {{ error }}
                            </Message>
                            <Button
                                severity="secondary"
                                label="Retry Connection"
                                :loading="meiliStore.isConnecting"
                                @click="retryConnection"
                            >
                                <template #icon>
                                    <RefreshCcw />
                                </template>
                            </Button>
                        </div>
                    </template>
                </Card>
            </div>
        </main>
    </Container>
</template>