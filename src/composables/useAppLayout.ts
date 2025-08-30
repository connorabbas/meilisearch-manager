import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { LayoutDashboard, ListCheck, KeyRound, Database } from 'lucide-vue-next';
import { type MenuItem } from '@/types';

export function useAppLayout() {
    const route = useRoute();
    const currentRoute = computed(() => route.name);
    const currentPath = computed(() => route.path);

    const isActiveRoute = (routeName: string, path?: string) => {
        if (currentRoute.value === routeName) return true;
        if (path && currentPath.value.startsWith(path)) return true;

        return false;
    };

    // Main menu items
    const menuItems = computed<MenuItem[]>(() => [
        {
            label: 'Dashboard',
            lucideIcon: LayoutDashboard,
            route: { name: 'dashboard' },
            active: isActiveRoute('dashboard'),
        },
        {
            label: 'Indexes',
            lucideIcon: Database,
            route: { name: 'indexes' },
            active: isActiveRoute('indexes') || currentPath.value.startsWith('/indexes'),
        },
        {
            label: 'Tasks',
            lucideIcon: ListCheck,
            route: { name: 'tasks' },
            active: isActiveRoute('tasks') || currentPath.value.startsWith('/tasks'),
        },
        {
            label: 'Keys',
            lucideIcon: KeyRound,
            route: { name: 'keys' },
            active: isActiveRoute('keys'),
        },
    ]);

    // Mobile menu
    const mobileMenuOpen = ref(false);
    const windowWidth = ref(window.innerWidth);
    const updateWidth = () => {
        windowWidth.value = window.innerWidth;
    };
    onMounted(() => {
        window.addEventListener('resize', updateWidth);
    });
    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth);
    });
    watchEffect(() => {
        if (windowWidth.value > 1024) {
            mobileMenuOpen.value = false;
        }
    });

    return {
        currentRoute,
        menuItems,
        mobileMenuOpen,
    };
}
