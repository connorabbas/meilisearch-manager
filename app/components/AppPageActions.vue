<script setup lang="ts">
// Renders two root nodes (desktop row + mobile popover), so attrs must not fall through.
defineOptions({ inheritAttrs: false })
</script>

<template>
    <div class="hidden md:flex items-center gap-2">
        <slot />
    </div>

    <div class="md:hidden">
        <UPopover :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
            <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                square
                aria-label="Open actions"
            />

            <template #content>
                <div class="flex min-w-52 flex-col items-stretch gap-2 p-4 [&>button]:w-full [&>button]:justify-center">
                    <slot />
                </div>
            </template>
        </UPopover>
    </div>
</template>
