<script setup lang="ts">
const props = withDefaults(defineProps<{
    src: string,
    alt?: string,
    title?: string,
    thumbnailClass?: string,
    previewClass?: string,
}>(), {
    alt: 'Document image',
    thumbnailClass: 'max-h-20 max-w-32 rounded-md object-contain',
    previewClass: 'max-h-[80vh] max-w-[min(90vw,72rem)] object-contain',
})

const open = ref(false)
</script>

<template>
    <span class="inline-flex">
        <button
            type="button"
            class="group relative shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="`Enlarge ${alt.toLowerCase()}`"
            aria-haspopup="dialog"
            @click="open = true"
        >
            <img
                :src="props.src"
                :alt="props.alt"
                :class="props.thumbnailClass"
            >
            <span
                class="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden="true"
            >
                <UIcon
                    name="i-lucide-eye"
                    class="size-6"
                />
            </span>
        </button>
        <UModal
            v-model:open="open"
            :title="props.title ?? props.alt"
            :ui="{ content: 'w-fit max-w-[95vw]' }"
        >
            <template #body>
                <img
                    :src="props.src"
                    :alt="props.alt"
                    :class="props.previewClass"
                >
            </template>
        </UModal>
    </span>
</template>
