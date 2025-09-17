<script setup lang="ts">
import { Menu as MenuIcon } from 'lucide-vue-next';
import { useAppLayout } from '@/composables/useAppLayout';
import Container from '@/components/Container.vue';
import LogoLink from '@/components/LogoLink.vue';
import PanelMenu from '@/components/primevue/PanelMenu.vue';
import Breadcrumb from '@/components/primevue/Breadcrumb.vue';
import type { MenuItem } from '@/types';

const props = withDefaults(defineProps<{
    breadcrumbs?: MenuItem[],
}>(), {
    breadcrumbs: () => [],
});

const {
    mobileMenuOpen,
    menuItems,
    currentRoute,
} = useAppLayout();
</script>

<template>
    <div class="h-screen flex flex-col">
        <Teleport to="body">
            <!-- Mobile drawer menu -->
            <Drawer
                v-model:visible="mobileMenuOpen"
                position="right"
            >
                <div>
                    <PanelMenu
                        :model="menuItems"
                        class="mt-1 w-full"
                    />
                </div>
                <template #footer>
                    <div class="flex flex-col">
                        <SelectColorModeButton />
                    </div>
                </template>
            </Drawer>
            <ScrollTop
                :buttonProps="{ class: 'fixed! right-4! bottom-4! md:right-8! md:bottom-8! z-1000!', rounded: true, raised: true }"
            />
        </Teleport>

        <!-- Mobile Header -->
        <header class="block lg:fixed top-0 left-0 right-0 z-50">
            <nav class="dynamic-bg shadow-sm flex justify-between items-center lg:hidden">
                <Container class="grow">
                    <div class="flex justify-between items-center py-4">
                        <div>
                            <LogoLink />
                        </div>
                        <div>
                            <Button
                                severity="secondary"
                                text
                                @click="mobileMenuOpen = true"
                            >
                                <template #icon>
                                    <MenuIcon class="size-6!" />
                                </template>
                            </Button>
                        </div>
                    </div>
                </Container>
            </nav>
        </header>

        <div class="flex-1">
            <!-- Desktop Sidebar -->
            <aside
                class="w-[18rem] inset-0 hidden lg:block fixed overflow-y-auto overflow-x-hidden dynamic-bg border-r dynamic-border"
            >
                <div class="w-full h-full flex flex-col justify-between p-4">
                    <div class="space-y-6">
                        <div class="p-2">
                            <LogoLink />
                        </div>
                        <div>
                            <PanelMenu
                                :key="currentRoute"
                                :model="menuItems"
                                class="mt-1 w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <SelectColorModeButton />
                    </div>
                </div>
            </aside>

            <!-- Scrollable Content -->
            <main class="flex flex-col h-full lg:pl-[18rem]">
                <Container
                    vertical
                    fluid
                >
                    <!-- Breadcrumbs -->
                    <Breadcrumb
                        v-if="props.breadcrumbs.length"
                        :model="props.breadcrumbs"
                    />

                    <!-- Page Content -->
                    <slot />
                </Container>
            </main>
        </div>
    </div>
</template>
