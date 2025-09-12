<script setup lang="ts">
import { computed, nextTick, ref, watchEffect } from 'vue';
import { looksLikeAnImageUrl } from '@/utils';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-vue-next';
import type { Hit } from 'meilisearch';
import { codeToHtml } from 'shiki';

const props = defineProps<{
    hit: Hit,
}>();

defineEmits(['edit', 'delete']);

const stringified = computed<string>(() =>
    JSON.stringify(props.hit, null, 2)
);
const hitHtml = ref<string>('');

const image = computed(() => Object.values(props.hit).find(looksLikeAnImageUrl) as string | null);

const expanded = ref(false);
const maxHeight = 320;
const shikiWrapper = ref<HTMLElement | null>(null);
const isOverflowing = ref(false);

const checkOverflow = () => {
    if (shikiWrapper.value) {
        isOverflowing.value = shikiWrapper.value.scrollHeight > maxHeight;
    }
};
const loading = ref(false);
watchEffect(async () => {
    loading.value = true;
    hitHtml.value = await codeToHtml(stringified.value, {
        lang: 'json',
        themes: {
            light: 'light-plus',
            dark: 'dark-plus',
        },
    }).finally(async () => {
        loading.value = false;
        await nextTick(() => {
            setTimeout(() => {
                checkOverflow();
            }, 1);
        });
    });
});
</script>

<template>
    <Card
        class="h-full group hover:border-primary transition-all duration-100 ease-in-out"
        pt:body:class="p-2"
    >
        <template #content>
            <div class="relative">
                <!-- <div
                    class="absolute inset-0 z-10 opacity-0 invisible transition-opacity duration-100 ease-in-out group-hover:opacity-100 group-hover:visible bg-radial-[at_100%_0%] from-surface-0 from-20% to-transparent to-80% dark:from-surface-900 dark:to-transparent">
                </div> -->
                <div
                    class="absolute z-20 bottom-2 left-2 opacity-0 invisible transition-opacity duration-100 ease-in-out group-hover:opacity-100 group-hover:visible"
                >
                    <div class="flex flex-col gap-2">
                        <Button
                            v-tooltip.right="'View/Edit Document'"
                            severity="secondary"
                            raised
                            @click="$emit('edit', props.hit)"
                        >
                            <template #icon>
                                <Pencil />
                            </template>
                        </Button>
                        <Button
                            v-tooltip.right="'Delete Document'"
                            severity="danger"
                            raised
                            @click="$emit('delete', props.hit)"
                        >
                            <template #icon>
                                <Trash2 />
                            </template>
                        </Button>
                    </div>
                </div>
                <div
                    v-if="image"
                    class="flex justify-center mb-4 overflow-hidden rounded-xl"
                >
                    <Image
                        v-if="looksLikeAnImageUrl(image)"
                        :src="image"
                        alt="Document Image"
                        pt:previewMask:class="rounded-xl"
                        pt:image:class="max-h-40 max-w-40 shrink object-cover object-top rounded-xl border dynamic-border"
                        preview
                    />
                </div>
                <div v-if="loading">
                    <Skeleton class="h-[20rem]!" />
                </div>
                <div
                    v-else
                    class="relative max-h-[25rem] overflow-y-auto no-scrollbar rounded-xl"
                >
                    <!-- overflow-hidden -->
                    <div
                        ref="shikiWrapper"
                        class="shiki-wrapper [&_pre.shiki]:p-2 [&_pre.shiki]:text-sm [&_pre.shiki]:leading-6 [&_pre.shiki]:no-scrollbar! transition-[max-height] duration-300 ease-in-out"
                        :class="(expanded || !isOverflowing) ? 'max-h-full' : 'max-h-80'"
                        v-html="hitHtml"
                    />
                    <!-- <div
                        v-if="isOverflowing && !expanded"
                        class="absolute z-10 bottom-0 left-0 right-0 h-40 bg-linear-to-b from-transparent to-surface-0 dark:to-surface-900 pointer-events-none"
                    /> -->
                </div>
            </div>
            <!-- <div
                v-if="isOverflowing"
                class="flex z-20 justify-center mt-2"
            >
                <Button
                    severity="secondary"
                    outlined
                    :label="expanded ? 'Collapse' : 'Expand'"
                    size="small"
                    class="flex flex-reverse"
                    fluid
                    @click="expanded = !expanded"
                >
                    <template #icon>
                        <ChevronUp v-if="expanded" />
                        <ChevronDown v-else />
                    </template>
                </Button>
            </div> -->
        </template>
    </Card>
</template>