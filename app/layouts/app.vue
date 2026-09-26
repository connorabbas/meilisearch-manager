<script setup lang="ts">
import { useAppLayout } from '@/composables/useAppLayout'
import ChangeInstanceModal from '@/components/meilisearch/ChangeInstanceModal.vue'

const {
    navigationItems,
    isSingleInstanceProxyMode,
    changeInstanceModalOpen,
    instanceMenuItems,
    currentMeilisearchInstanceName,
} = useAppLayout()
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
                        popover
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

            <template
                v-if="!isSingleInstanceProxyMode"
                #footer="{ collapsed }"
            >
                <UDropdownMenu
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

        <slot />

        <ChangeInstanceModal v-model="changeInstanceModalOpen" />
    </UDashboardGroup>
</template>
