<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';

const props = defineProps<{
    subject: string
}>();
</script>

<template>
    <div class="flex justify-center items-center gap-2 p-5 text-muted-color">
        <AlertCircle />
        <div>
            No {{ props.subject }}s found
        </div>
    </div>
</template>