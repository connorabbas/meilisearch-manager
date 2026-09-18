<script setup lang="ts">
import { useAppLayout } from '@/composables/useAppLayout'
import SelectColorModePopoverButton from '@/components/SelectColorModePopoverButton.vue'
import ChangeInstanceModal from '@/components/meilisearch/ChangeInstanceModal.vue'
import { ChevronsUpDown, Home, Menu as MenuIcon } from '@lucide/vue'
import Container from '@/components/Container.vue'
import PopupMenuButton from '@/components/PopupMenuButton.vue'
import LogoLink from '@/components/LogoLink.vue'
import Menubar from '@/components/router-link-menus/Menubar.vue'
import PanelMenu from '@/components/router-link-menus/PanelMenu.vue'
import Breadcrumb from '@/components/router-link-menus/Breadcrumb.vue'
import type { MenuItem } from '@/types'

const route = useRoute()

const staticBreadcrumbs = computed(() => route.meta.breadcrumbs as MenuItem[] | undefined)
const breadcrumbs = computed<MenuItem[]>(() => {
    const uidParam = route.params.uid

    if (typeof uidParam === 'string' && route.path.startsWith('/indexes/')) {
        const dynamicBreadcrumbs: MenuItem[] = [
            { route: '/dashboard', lucideIcon: Home },
            { route: '/indexes', label: 'Indexes' },
            { route: `/indexes/${uidParam}`, label: uidParam },
        ]

        if (route.path.endsWith('/documents')) {
            dynamicBreadcrumbs.push({ label: 'Documents' })
        } else if (route.path.endsWith('/settings')) {
            dynamicBreadcrumbs.push({ label: 'Settings' })
        } else if (route.path.endsWith('/edit')) {
            dynamicBreadcrumbs.push({ label: 'Edit' })
        }

        return dynamicBreadcrumbs
    }

    return staticBreadcrumbs.value ?? []
})

const {
    currentRoute,
    mobileMenuOpen,
    menuItems,
    isSingleInstanceProxyMode,
    changeInstanceModalOpen,
    meilisearchInstanceMenuItems,
    currentMeilisearchIntanceName,
} = useAppLayout()

const isOpaque = ref(false)
const onScroll = () => {
    isOpaque.value = window.scrollY > 10 // 10px scroll threshold
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // run once in case the page is already scrolled
})
onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
})
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
                        v-if="isSingleInstanceProxyMode"
                        :show-label="false"
                    />
                    <PopupMenuButton
                        v-else
                        name="mobile-meili-instance-dd"
                        severity="secondary"
                        size="large"
                        :menu-items="meilisearchInstanceMenuItems"
                        :label="currentMeilisearchIntanceName"
                    >
                        <template #icon>
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
                                    <template v-if="isSingleInstanceProxyMode">
                                        <SelectColorModeButton :show-label="false" />
                                    </template>
                                    <template v-else>
                                        <SelectColorModePopoverButton
                                            name="desktop-color-mode"
                                            fixed-position="right"
                                        />
                                        <PopupMenuButton
                                            name="desktop-meili-instance-dd"
                                            side="right"
                                            severity="secondary"
                                            :menu-items="meilisearchInstanceMenuItems"
                                            :label="currentMeilisearchIntanceName"
                                            text
                                        />
                                    </template>
                                </div>
                                <!-- Mobile Menu Toggle -->
                                <div class="flex items-center lg:hidden">
                                    <div class="flex gap-4">
                                        <SelectColorModePopoverButton name="mobile-color-mode" />
                                        <Button
                                            aria-label="Open navigation"
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
                            v-if="breadcrumbs?.length"
                            :model="breadcrumbs"
                        />
                        <!-- Page Content -->
                        <slot />
                    </Container>
                </div>
            </main>
        </div>
    </div>
</template>
