<script setup lang="ts">
import { RouterView } from 'vue-router';
import { completeAsyncLoading } from '@/router';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';
</script>

<template>
    <div>
        <Toast position="bottom-right" />
        <RouterView v-slot="{ Component }">
            <template v-if="Component">
                <Suspense
                    @resolve="completeAsyncLoading"
                    @reject="completeAsyncLoading"
                >
                    <component :is="Component" />
                    <template #fallback>
                        <div class="h-screen flex items-center justify-center">
                            <ProgressSpinner />
                        </div>
                    </template>
                </Suspense>
            </template>
        </RouterView>
    </div>
</template>