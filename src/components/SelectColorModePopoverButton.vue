<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import SelectColorModeButton from '@/components/SelectColorModeButton.vue';
import Popover from 'primevue/popover';
import { SunMoon } from 'lucide-vue-next';

const props = defineProps<{
    name: string,
    fixedPosition?: 'left' | 'right',
}>();

type PopoverType = InstanceType<typeof Popover>;
const popover = useTemplateRef<PopoverType>(props.name);
function togglePopover(event: Event) {
    if (popover.value) {
        popover.value.toggle(event);
    }
}

const appendToId = computed(() => {
    return props.name.replace(/[^a-zA-Z0-9]/g, '') + '_append';
});

const popoverPositionClasses = computed(() => {
    let classes = '';
    if (props?.fixedPosition) {
        switch (props?.fixedPosition) {
        case 'left':
            classes = 'left-auto! top-0! left-0';
            break;
        case 'right':
            classes = 'left-auto! top-0! right-0';
            break;
        default:
            break;
        }
    }

    return classes;
});
</script>

<template>
    <div class="flex flex-col">
        <Button
            v-tooltip.left="'Change color mode'"
            severity="secondary"
            text
            rounded
            @click="togglePopover"
        >
            <template #icon>
                <SunMoon class="size-5!" />
            </template>
        </Button>
        <div
            v-if="props?.fixedPosition"
            :id="appendToId"
            class="relative"
        />
        <Popover
            :ref="props.name"
            :appendTo="props?.fixedPosition ? `#${appendToId}` : 'body'"
            :pt="{
                root: { class: ['z-1200', popoverPositionClasses] },
                content: { class: 'p-2' }
            }"
        >
            <SelectColorModeButton />
        </Popover>
    </div>
</template>