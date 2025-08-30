<script setup lang="ts">
import { useAppLayout } from '@/composables/useAppLayout';
import { Menu as MenuIcon } from 'lucide-vue-next';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import ScrollTop from 'primevue/scrolltop';
import Container from '@/components/Container.vue';
import NavLogoLink from '@/components/NavLogoLink.vue';
import Menubar from '@/components/primevue/Menubar.vue';
import PanelMenu from '@/components/primevue/PanelMenu.vue';
import Breadcrumb from '@/components/primevue/Breadcrumb.vue';
import type { MenuItem } from '@/types';

const props = withDefaults(defineProps<{
    breadcrumbs?: MenuItem[],
}>(), {
    breadcrumbs: () => [],
});

const {
    currentRoute,
    mobileMenuOpen,
    menuItems,
} = useAppLayout();
</script>

<template>
    <div>
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
                        <!-- TODO: color mode toggle here -->
                    </div>
                </template>
            </Drawer>
            <ScrollTop
                :buttonProps="{ class: 'fixed! right-4! bottom-4! md:right-8! md:bottom-8! z-[1000]!', rounded: true, raised: true }"
            />
        </Teleport>
        <div class="min-h-screen">
            <!-- Primary Navigation Menu -->
            <nav class="dynamic-bg shadow-sm">
                <Container>
                    <Menubar
                        :key="currentRoute"
                        :model="menuItems"
                        pt:root:class="px-0 py-4 border-0 rounded-none dynamic-bg"
                        pt:button:class="hidden"
                    >
                        <template #start>
                            <div class="shrink-0 flex items-center mr-5">
                                <NavLogoLink />
                            </div>
                        </template>
                        <template #end>
                            <div class="hidden lg:flex items-center ms-6 space-x-3">
                                <!-- TODO: color mode toggle here -->
                            </div>

                            <!-- Mobile Menu Toggle -->
                            <div class="flex items-center lg:hidden">
                                <div class="relative">
                                    <Button
                                        severity="secondary"
                                        class="p-1!"
                                        text
                                        @click="mobileMenuOpen = true"
                                    >
                                        <template #icon>
                                            <MenuIcon class="size-6!" />
                                        </template>
                                    </Button>
                                </div>
                            </div>
                        </template>
                    </Menubar>
                </Container>
            </nav>

            <main>
                <Container vertical>
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
