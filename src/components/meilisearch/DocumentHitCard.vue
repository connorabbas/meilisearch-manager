<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { looksLikeAnImageUrl } from '@/utils';
import { Pencil, Trash2 } from 'lucide-vue-next';
import type { Hit } from 'meilisearch';
import ThemedJsonViewer from '../ThemedJsonViewer.vue';

const props = defineProps<{
    primaryKey?: string,
    hit: Hit,
}>();

defineEmits(['edit', 'delete']);

const image = computed(() => Object.values(props.hit).find(looksLikeAnImageUrl) as string | null);

const expandedData = ref(false);
const expandedDataDepth = ref(1);

watch(expandedData, (newVal) => {
    if (newVal) {
        expandedDataDepth.value = 999;
    } else {
        expandedDataDepth.value = 1;
    }
});
</script>

<template>
    <Card
        class="h-full group hover:border-primary transition-all duration-100 ease-in-out"
        pt:body:class="p-2"
    >
        <template #content>
            <div class="relative">
                <div
                    class="absolute z-20 top-2 right-2 opacity-0 invisible transition-opacity duration-100 ease-in-out group-hover:opacity-100 group-hover:visible"
                >
                    <div class="flex flex-col gap-2">
                        <Button
                            v-tooltip.left="'View/Edit Document'"
                            severity="secondary"
                            raised
                            @click="$emit('edit', props.hit)"
                        >
                            <template #icon>
                                <Pencil />
                            </template>
                        </Button>
                        <Button
                            v-if="props.primaryKey"
                            v-tooltip.left="'Delete Document'"
                            severity="danger"
                            raised
                            @click="$emit('delete', props.hit[props.primaryKey])"
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
                <div>
                    <ThemedJsonViewer
                        class="py-2"
                        :data="props.hit"
                        :expanded="expandedData"
                        :expandDepth="expandedDataDepth"
                    />
                </div>
            </div>
        </template>
    </Card>
</template>