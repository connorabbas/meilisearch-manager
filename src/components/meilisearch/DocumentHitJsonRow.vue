<script setup lang="ts">
import { computed } from 'vue'
import { looksLikeAnImageUrl } from '@/utils'
import { Pencil, Trash2 } from 'lucide-vue-next'
import type { Hit } from 'meilisearch'
import ThemedJsonViewer from '../ThemedJsonViewer.vue'

const props = defineProps<{
    primaryKey?: string,
    hit: Hit,
}>()

defineEmits(['edit', 'delete'])

const image = computed(() => Object.values(props.hit).find(looksLikeAnImageUrl) as string | null)
</script>

<template>
    <Card
        class="h-full group hover:border-primary transition-all duration-100 ease-in-out"
        pt:body:class="p-4"
    >
        <template #content>
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div
                    v-if="image"
                    class="rounded-xl"
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
                <div
                    ref="document-json-viewer"
                    class="grow rounded-lg"
                >
                    <ThemedJsonViewer
                        class="py-2 rounded-lg"
                        :data="props.hit"
                    />
                </div>
                <div class="flex flex-row sm:flex-col justify-end gap-4">
                    <Button
                        v-tooltip.left="'Edit Document'"
                        severity="secondary"
                        outlined
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
                        outlined
                        @click="$emit('delete', props.hit[props.primaryKey])"
                    >
                        <template #icon>
                            <Trash2 />
                        </template>
                    </Button>
                </div>
            </div>
        </template>
    </Card>
</template>
