import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { useMeilisearchStore } from '@/stores/meilisearch'

export function useAppLayout() {
    const meilisearchStore = useMeilisearchStore()
    const route = useRoute()
    const navigationItems = computed<NavigationMenuItem[]>(() => [
        {
            label: 'Dashboard',
            icon: 'i-lucide-layout-dashboard',
            to: '/dashboard',
            active: route.path === '/dashboard',
        },
        {
            label: 'Indexes',
            icon: 'i-lucide-folder-search',
            to: '/indexes',
            active: route.path.startsWith('/indexes'),
        },
        {
            label: 'Tasks',
            icon: 'i-lucide-list-todo',
            to: '/tasks',
            active: route.path === '/tasks',
        },
        {
            label: 'Keys',
            icon: 'i-lucide-key-round',
            to: '/keys',
            active: route.path === '/keys',
        },
        {
            label: 'Search Rules',
            icon: 'i-lucide-search-check',
            to: '/search-rules',
            active: route.path.startsWith('/search-rules'),
        },
        {
            label: 'Experimental Features',
            icon: 'i-lucide-flask-conical',
            to: '/experimental-features',
            active: route.path === '/experimental-features',
        },
        {
            label: 'Backups',
            icon: 'i-lucide-database-backup',
            active: route.path.startsWith('/backups'),
            defaultOpen: true,
            children: [
                {
                    label: 'Dumps',
                    to: '/backups/dumps',
                },
                {
                    label: 'Snapshots',
                    to: '/backups/snapshots',
                },
            ]
        },
    ])

    const changeInstanceModalOpen = ref(false)
    const currentMeilisearchInstanceName = computed(() => meilisearchStore.currentInstance?.name ?? 'Default')
    const instanceMenuItems = computed<DropdownMenuItem[][]>(() => [[
        {
            label: 'New Instance',
            icon: 'i-lucide-plus',
            to: '/new-instance',
        },
        {
            label: 'Change Instance',
            icon: 'i-lucide-arrow-left-right',
            onSelect: () => changeInstanceModalOpen.value = true,
        },
    ], [
        {
            label: 'Remove Instance',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: async () => {
                if (meilisearchStore.currentInstance?.id) {
                    meilisearchStore.confirmRemoveInstance(meilisearchStore.currentInstance.id, async () => {
                        if (!meilisearchStore.hasConfiguredInstance) {
                            await navigateTo('/new-instance', { replace: true })
                            return
                        }

                        try {
                            await meilisearchStore.connect()
                        } catch (error) {
                            console.error('Failed to connect instance', error)
                        }

                        await navigateTo('/dashboard', { replace: true })
                    })
                }
            },
        },
    ]])

    return {
        navigationItems,
        isSingleInstanceProxyMode: meilisearchStore.isSingleInstanceProxyMode,
        changeInstanceModalOpen,
        instanceMenuItems,
        currentMeilisearchInstanceName,
    }
}
