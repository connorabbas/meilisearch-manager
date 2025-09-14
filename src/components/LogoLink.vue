<script setup lang="ts">
const props = defineProps<{
    imgClasses?: string,
}>();
</script>

<template>
    <Button
        v-slot="slotProps"
        asChild
        variant="link"
    >
        <RouterLink
            :to="{ name: 'welcome' }"
            :class="slotProps?.class"
            class="flex items-center justify-start gap-4 no-underline! p-0 rounded-none"
        >
            <img
                :class="['block h-4 lg:h-6 w-auto', props.imgClasses]"
                src="/meili-logo.svg"
                alt="Meili Logo"
            >
        </RouterLink>
    </Button>
</template>