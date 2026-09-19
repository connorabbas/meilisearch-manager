<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import { useAppLayout } from '@/composables/useAppLayout'
import ChangeInstanceModal from '@/components/meilisearch/ChangeInstanceModal.vue'

const route = useRoute()
const appScrollContainer = useTemplateRef<HTMLElement>('app-scroll-container')
const showScrollTop = ref(false)

const staticBreadcrumbs = computed(() => route.meta.breadcrumbs as BreadcrumbItem[] | undefined)
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const uidParam = route.params.uid

    if (typeof uidParam === 'string' && route.path.startsWith('/indexes/')) {
        const dynamicBreadcrumbs: BreadcrumbItem[] = [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Indexes', to: '/indexes' },
            { label: uidParam, to: `/indexes/${encodeURIComponent(uidParam)}` },
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
    navigationItems,
    isSingleInstanceProxyMode,
    changeInstanceModalOpen,
    instanceMenuItems,
    currentMeilisearchInstanceName,
} = useAppLayout()

function updateScrollTopVisibility() {
    showScrollTop.value = (appScrollContainer.value?.scrollTop ?? 0) > 200
}

function scrollToTop() {
    appScrollContainer.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
    appScrollContainer.value?.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
})

onUnmounted(() => {
    appScrollContainer.value?.removeEventListener('scroll', updateScrollTopVisibility)
})
</script>

<template>
    <UDashboardGroup
        storage="local"
        storage-key="meilisearch-manager-dashboard"
        unit="rem"
    >
        <UDashboardSidebar
            id="main"
            mode="slideover"
            collapsible
            resizable
            :min-size="14"
            :default-size="17"
            :max-size="24"
            :collapsed-size="4"
            class="bg-elevated/25"
            :ui="{ footer: 'border-t border-default' }"
        >
            <template #header="{ collapsed }">
                <div
                    v-if="collapsed"
                    class="flex w-full justify-center"
                >
                    <LogoLink img-classes="h-5" />
                </div>
                <div
                    v-else
                    class="flex min-w-0 w-full items-center gap-2"
                >
                    <LogoLink img-classes="h-5" />
                    <span class="truncate text-sm font-semibold text-highlighted">Meilisearch Manager</span>
                </div>
            </template>

            <template #default="{ collapsed }">
                <div class="flex flex-1 flex-col gap-2">
                    <UNavigationMenu
                        :collapsed="collapsed"
                        :items="navigationItems"
                        orientation="vertical"
                        tooltip
                    />
                    <UTooltip
                        v-if="collapsed"
                        :content="{ side: 'right' }"
                        text="Color mode"
                    >
                        <UColorModeButton
                            aria-label="Color mode"
                            color="neutral"
                            variant="ghost"
                            square
                            class="mt-auto"
                        />
                    </UTooltip>
                    <UColorModeSelect
                        v-else
                        aria-label="Color mode"
                        color="neutral"
                        variant="outline"
                        :search-input="false"
                        class="mt-auto w-full"
                    />
                </div>
            </template>

            <template #footer="{ collapsed }">
                <UDropdownMenu
                    v-if="!isSingleInstanceProxyMode"
                    :items="instanceMenuItems"
                    :content="{ align: 'center', collisionPadding: 12 }"
                    :class="collapsed ? 'w-10' : 'w-full'"
                    :ui="{ content: collapsed ? 'w-52' : 'w-(--reka-dropdown-menu-trigger-width)' }"
                >
                    <UTooltip
                        :disabled="!collapsed"
                        :content="{ side: 'right' }"
                        text="Instance"
                    >
                        <UButton
                            :label="collapsed ? undefined : currentMeilisearchInstanceName"
                            icon="i-lucide-database"
                            :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
                            color="neutral"
                            variant="ghost"
                            :square="collapsed"
                            block
                            class="data-[state=open]:bg-elevated"
                        />
                    </UTooltip>
                </UDropdownMenu>
            </template>
        </UDashboardSidebar>

        <UDashboardPanel :ui="{ body: 'overflow-hidden p-0' }">
            <template #header>
                <UDashboardNavbar>
                    <template #left>
                        <UDashboardSidebarCollapse />
                        <UBreadcrumb
                            v-if="breadcrumbs.length"
                            :items="breadcrumbs"
                            color="neutral"
                        />
                    </template>
                </UDashboardNavbar>
            </template>

            <template #body>
                <div
                    id="app-scroll-container"
                    ref="app-scroll-container"
                    class="flex flex-1 flex-col overflow-y-auto"
                >
                    <Container vertical>
                        <slot />
                    </Container>
                </div>
            </template>
        </UDashboardPanel>

        <ChangeInstanceModal v-model="changeInstanceModalOpen" />

        <UButton
            v-if="showScrollTop"
            aria-label="Scroll to top"
            icon="i-lucide-arrow-up"
            color="primary"
            class="fixed end-4 bottom-4 z-50 rounded-full shadow-lg sm:end-6 sm:bottom-6"
            @click="scrollToTop"
        />
    </UDashboardGroup>
</template>
