<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import Menu from '@/components/primevue/Menu.vue';
import { MenuItem } from 'primevue/menuitem';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
    name: string,
    menuItems: MenuItem[],
    buttonLabel: string,
    fixedPosition?: 'left' | 'right',
}>();

const appendToId = computed(() => {
    return props.name.replace(/[^a-zA-Z0-9]/g, '') + '_append';
});

type MenuType = InstanceType<typeof Menu>;
const dropdownMenu = useTemplateRef<MenuType>(props.name);
const toggleDropdownMenu = (event: Event) => {
    if (dropdownMenu.value) {
        dropdownMenu.value.toggle(event);
    }
};

const menuPositionClasses = computed(() => {
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
            id="instances-menu-btn"
            :label="props.buttonLabel"
            pt:root:class="flex flex-row-reverse justify-between"
            severity="secondary"
            text
            @click="toggleDropdownMenu($event)"
        >
            <template #icon>
                <slot
                    v-if="$slots.toggleIcon"
                    name="toggleIcon"
                />
                <ChevronDown v-else />
            </template>
        </Button>
        <div
            v-if="props?.fixedPosition"
            :id="appendToId"
            class="relative"
        />
        <Menu
            :ref="props.name"
            :appendTo="props?.fixedPosition ? `#${appendToId}` : 'body'"
            :model="props.menuItems"
            :pt:root:class="['z-[1200]', menuPositionClasses]"
            popup
        />
    </div>
</template>