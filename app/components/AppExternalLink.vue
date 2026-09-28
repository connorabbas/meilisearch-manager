<script setup lang="ts">
withDefaults(defineProps<{
    href: string,
    label?: string,
    color?: 'neutral' | 'warning',
    variant?: 'link' | 'soft',
}>(), {
    color: 'neutral',
    variant: 'link',
})
</script>

<template>
    <UButton
        :href="href"
        target="_blank"
        rel="noopener noreferrer"
        :label="label"
        :color="color"
        :variant="variant"
        trailing-icon="i-lucide-arrow-up-right"
        class="underline underline-offset-2"
        :ui="{ trailingIcon: 'size-3 text-dimmed' }"
    >
        <slot />
    </UButton>
</template>
