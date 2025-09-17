<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAppLayout } from '@/composables/useAppLayout';
import SelectColorModePopoverButton from '@/components/SelectColorModePopoverButton.vue';
import ChangeInstanceModal from '@/components/meilisearch/ChangeInstanceModal.vue';
import { ChevronsUpDown, Menu as MenuIcon } from 'lucide-vue-next';
import Container from '@/components/Container.vue';
import PopupMenuButton from '@/components/PopupMenuButton.vue';
import LogoLink from '@/components/LogoLink.vue';
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
    singleInstanceMode,
    changeInstanceModalOpen,
    meilisearchInstanceMenuItems,
    currentMeilisearchIntanceName,
} = useAppLayout();

const isOpaque = ref(false);
const onScroll = () => {
    isOpaque.value = window.scrollY > 10; // 10px scroll threshold
};

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once in case the page is already scrolled
});
onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
});
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
                    <SelectColorModeButton
                        v-if="singleInstanceMode"
                        :show-label="false"
                    />
                    <PopupMenuButton
                        v-else
                        name="mobile-meili-instance-dd"
                        button-variant="text"
                        :menu-items="meilisearchInstanceMenuItems"
                        :button-label="currentMeilisearchIntanceName"
                    >
                        <template #toggleIcon>
                            <ChevronsUpDown />
                        </template>
                    </PopupMenuButton>
                </template>
            </Drawer>
            <ChangeInstanceModal v-model="changeInstanceModalOpen" />
            <ScrollTop
                :buttonProps="{ class: 'fixed! right-4! bottom-4! md:right-8! md:bottom-8! z-1000!', rounded: true, raised: true }"
            />
        </Teleport>
        <div class="min-h-screen">
            <!-- Primary Navigation Menu -->
            <header class="block lg:fixed top-0 left-0 right-0 z-50">
                <nav
                    class="backdrop-blur transition-colors duration-500 border-b dynamic-border data-[is-opaque=true]:bg-surface-0 data-[is-opaque=true]:supports-backdrop-blur:bg-surface-0/95 data-[is-opaque=true]:dark:bg-surface-900/75 data-[is-opaque=false]:bg-surface-0 data-[is-opaque=false]:dark:bg-surface-900"
                    :data-is-opaque="isOpaque"
                >
                    <Container>
                        <Menubar
                            :key="currentRoute"
                            :model="menuItems"
                            pt:root:class="px-0 py-0 border-0 rounded-none bg-transparent h-[var(--header-height)]!"
                            pt:button:class="hidden"
                        >
                            <template #start>
                                <div class="shrink-0 flex items-center gap-6 mr-6">
                                    <LogoLink />
                                </div>
                            </template>
                            <template #end>
                                <div class="hidden lg:flex items-center ms-6 space-x-4">
                                    <template v-if="singleInstanceMode">
                                        <SelectColorModeButton :show-label="false" />
                                    </template>
                                    <template v-else>
                                        <SelectColorModePopoverButton
                                            name="desktop-color-mode"
                                            fixed-position="right"
                                        />
                                        <PopupMenuButton
                                            name="desktop-meili-instance-dd"
                                            button-variant="text"
                                            fixed-position="right"
                                            :menu-items="meilisearchInstanceMenuItems"
                                            :button-label="currentMeilisearchIntanceName"
                                        />
                                    </template>
                                </div>
                                <!-- Mobile Menu Toggle -->
                                <div class="flex items-center lg:hidden">
                                    <div class="flex gap-4">
                                        <SelectColorModePopoverButton name="mobile-color-mode" />
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
            </header>

            <main>
                <div class="lg:pt-[var(--header-height)]">
                    <Container vertical>
                        <!-- Breadcrumbs -->
                        <Breadcrumb
                            v-if="props.breadcrumbs.length"
                            :model="props.breadcrumbs"
                        />
                        <!-- Page Content -->
                        <slot />
                    </Container>
                </div>
            </main>
        </div>
    </div>
</template>
