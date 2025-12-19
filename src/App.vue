<script setup lang="ts">
import { RouterView } from 'vue-router'
import { completeAsyncLoading } from '@/router'
import AppToast from './components/AppToast.vue'
import { AlertCircle } from 'lucide-vue-next'
</script>

<template>
    <div>
        <AppToast />
        <ConfirmDialog
            group="delete"
            :draggable="false"
            blockScroll
        >
            <template #icon>
                <AlertCircle />
            </template>
        </ConfirmDialog>
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
