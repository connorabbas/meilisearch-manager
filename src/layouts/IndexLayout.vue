<script setup lang="ts">
import { computed } from 'vue';
import { useIndexes } from '@/composables/meilisearch/useIndexes';
import { useRoute } from 'vue-router';
import { completeAsyncLoading } from '@/router';
import { Home, RefreshCw } from 'lucide-vue-next';
import AppLayout from './AppLayout.vue';
import PageTitleSection from '@/components/PageTitleSection.vue';
import IndexTabMenu from '@/components/meilisearch/IndexTabMenu.vue';
import type { MenuItem } from '@/types';

const props = defineProps<{
    indexUID: string;
}>();

const route = useRoute();
const { currentIndex, isFetching, error, fetchIndex } = useIndexes();

await fetchIndex(props.indexUID);

const breadcrumbs = computed(() => {
    const dynamicBreadcrumbs: MenuItem[] = [
        { route: { name: 'dashboard' }, lucideIcon: Home },
        { label: 'Indexes', route: { name: 'indexes' } },
        { label: props.indexUID, route: { name: 'index-details', params: { indexUID: props.indexUID } } },
    ];
    if (route.meta.breadcrumbLabel) {
        const breadcrumbLabel = route.meta.breadcrumbLabel as string;
        dynamicBreadcrumbs.push({ label: breadcrumbLabel });
    }
    return dynamicBreadcrumbs;
});

const currentRouteName = computed(() => route.name as string);
</script>

<template>
    <AppLayout :breadcrumbs>
        <PageTitleSection>
            <template #title>
                <div class="flex items-center gap-4">
                    <span>Index: {{ indexUID }}</span>
                    <Tag
                        v-if="currentIndex?.primaryKey"
                        :value="`Primary Key: ${currentIndex.primaryKey}`"
                        severity="info"
                    />
                </div>
            </template>
            <template #end>
                <div
                    v-if="route.meta?.breadcrumbLabel === 'Details'"
                    class="flex gap-4"
                >
                    <Button
                        label="Refresh"
                        severity="secondary"
                        :loading="isFetching"
                        @click="fetchIndex(props.indexUID)"
                    >
                        <template #icon>
                            <RefreshCw />
                        </template>
                        <template #loadingicon>
                            <RefreshCw class="animate-spin" />
                        </template>
                    </Button>
                </div>
            </template>
        </PageTitleSection>

        <Message
            v-if="error"
            severity="error"
            :closable="false"
        >
            <span class="font-bold">Error loading index:</span> {{ error }}
        </Message>

        <IndexTabMenu
            :current-route-name="currentRouteName"
            :indexUID="indexUID"
        />

        <RouterView
            v-if="currentIndex"
            v-slot="{ Component }"
        >
            <template v-if="Component">
                <!-- Another Suspense Layer because we have nested async components -->
                <Suspense
                    @resolve="completeAsyncLoading"
                    @reject="completeAsyncLoading"
                >
                    <component
                        :is="Component"
                        :index="currentIndex"
                        @refetch-index="fetchIndex(props.indexUID)"
                        @nullify-index="currentIndex = null"
                    />
                    <template #fallback>
                        <div class="h-full flex items-center justify-center p-8">
                            <ProgressSpinner />
                        </div>
                    </template>
                </Suspense>
            </template>
        </RouterView>
    </AppLayout>
</template>