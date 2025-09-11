<script setup lang="ts">
import { Check, CircleX, Info, LoaderCircle, TriangleAlert } from 'lucide-vue-next';
</script>

<template>
    <!-- Custom Toast, to show spinner icon for Tasks -->
    <Toast position="bottom-right">
        <template #message="{ message }">
            <div class="flex items-start flex-auto gap-3">
                <div class="flex items-center">
                    <Check
                        v-if="message.severity === 'success'"
                        class="size-5!"
                    />
                    <Info
                        v-if="message.severity === 'info'"
                        class="size-5!"
                    />
                    <TriangleAlert
                        v-if="message.severity === 'warn'"
                        class="size-5!"
                    />
                    <CircleX
                        v-if="message.severity === 'error'"
                        class="size-5!"
                    />
                    <LoaderCircle
                        v-else-if="message.severity === 'secondary'"
                        class="size-5! animate-spin"
                    />
                </div>
                <div
                    class="p-toast-message-text"
                    :data-p="message.severity"
                    data-pc-section="messagetext"
                >
                    <span
                        class="p-toast-summary"
                        data-p="info"
                        data-pc-section="summary"
                    >
                        {{ message.summary }}
                    </span>
                    <div
                        v-if="message.detail"
                        class="p-toast-detail"
                        data-p="info"
                        data-pc-section="detail"
                    >
                        {{ message.detail }}
                    </div>
                </div>
            </div>
        </template>
    </Toast>
</template>