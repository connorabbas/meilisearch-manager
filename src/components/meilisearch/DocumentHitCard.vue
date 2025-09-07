<script setup lang="ts">
import type { Hit } from 'meilisearch';
import { codeToHtml } from 'shiki';
import { computed, ref, watchEffect } from 'vue';

const props = defineProps<{
    hit: Hit,
}>();

const stringified = computed<string>(() =>
    JSON.stringify(props.hit, null, 2)
);
const hitHtml = ref<string>('');

watchEffect(async () => {
    hitHtml.value = await codeToHtml(stringified.value, {
        lang: 'json',
        themes: {
            light: 'light-plus',
            dark: 'dark-plus',
        },
    });
});
</script>

<template>
    <Card class="h-full">
        <template #content>
            <!-- [&_pre.shiki]:max-h-[30rem] -->
            <div
                class="shiki-wrapper [&_pre.shiki]:p-4 [&_pre.shiki]:rounded-md [&_pre.shiki]:text-sm [&_pre.shiki]:leading-6"
                v-html="hitHtml"
            />
        </template>
    </Card>
</template>