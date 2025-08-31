<script setup lang="ts">
import Message from 'primevue/message';

defineProps<{
    errors: string[],
}>();
</script>

<template>
    <div
        v-if="errors"
        class="space-y-1"
    >
        <Message
            v-for="(errorMessage, index) in errors"
            :key="index"
            severity="error"
            variant="simple"
            size="small"
        >
            {{ errorMessage }}
        </Message>
    </div>
</template>
