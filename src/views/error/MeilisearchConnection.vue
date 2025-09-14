<script setup lang="ts">
import Container from '@/components/Container.vue';
import { useMeilisearchStore } from '@/stores/meilisearch';
import { CircleX, RefreshCw } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const meilisearchStore = useMeilisearchStore();

const error = computed(() => {
    return meilisearchStore.connectionError || 'Unable to connect to to the configured Meilisearch instance...';
});

const retryConnection = async () => {
    await meilisearchStore.connect();
    if (meilisearchStore.isConnected) {
        router.push({ name: 'indexes' });
    }
};
</script>

<template>
    <Container fluid>
        <main>
            <div class="h-screen flex items-center justify-center">
                <Card pt:body:class="p-4 py-6 sm:p-12">
                    <template #content>
                        <div class="text-center">
                            <section class="flex flex-col gap-6 md:gap-8 items-center justify-center text-center">
                                <h1 class="font-extrabold text-6xl">
                                    Connection Error
                                </h1>
                                <Message severity="error">
                                    <template #icon>
                                        <CircleX />
                                    </template>
                                    {{ error }}
                                </Message>
                                <Button
                                    v-if="meilisearchStore.currentInstance"
                                    label="Retry Connection"
                                    :loading="meilisearchStore.isConnecting"
                                    @click="retryConnection"
                                >
                                    <template #icon>
                                        <RefreshCw />
                                    </template>
                                    <template #loadingicon>
                                        <RefreshCw class="animate-spin" />
                                    </template>
                                </Button>
                                <Button
                                    v-if="!meilisearchStore.singleInstanceMode"
                                    v-slot="slotProps"
                                    severity="secondary"
                                    asChild
                                >
                                    <RouterLink
                                        :to="{ name: 'new-instance' }"
                                        :class="[slotProps.class, 'no-underline']"
                                    >
                                        Add new instance
                                    </RouterLink>
                                </Button>
                            </section>
                        </div>
                    </template>
                </Card>
            </div>
        </main>
    </Container>
</template>