<script setup lang="ts">
import { looksLikeAnImageUrl } from '@/utils';
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

const image = computed(() => Object.values(props.hit).find(looksLikeAnImageUrl) as string | null);

const loading = ref(false);
watchEffect(async () => {
    loading.value = true;
    hitHtml.value = await codeToHtml(stringified.value, {
        lang: 'json',
        themes: {
            light: 'light-plus',
            dark: 'dark-plus',
        },
    }).finally(() => {
        loading.value = false;
    });
});
</script>

<template>
    <Card
        class="h-full"
        pt:body:class="p-2"
    >
        <template #content>
            <div
                v-if="image"
                class="flex justify-center mb-4 overflow-hidden rounded-xl"
            >
                <Image
                    v-if="looksLikeAnImageUrl(image)"
                    :src="image"
                    alt="Document Image"
                    pt:image:class="max-h-40 max-w-40 md:max-h-60 md:max-w-60 shrink object-cover object-top rounded-xl border dynamic-border"
                    preview
                />
            </div>
            <div v-if="loading">
                <Skeleton class="h-[25rem]!" />
            </div>
            <div
                v-else
                class="shiki-wrapper [&_pre.shiki]:p-2 [&_pre.shiki]:rounded-lg [&_pre.shiki]:text-sm [&_pre.shiki]:leading-6"
                v-html="hitHtml"
            />
        </template>
    </Card>
</template>