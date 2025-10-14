import type { RouteLocationRaw } from 'vue-router'
import type { DataTableFilterMetaData } from 'primevue'
import type { MenuItem as PrimeVueMenuItem } from 'primevue/menuitem'
import type { LucideIcon } from 'lucide-vue-next'

export type PrimeVueDataFilters = {
    [key: string]: DataTableFilterMetaData;
};

export interface MenuItem extends PrimeVueMenuItem {
    route?: RouteLocationRaw;
    lucideIcon?: LucideIcon;
    lucideIconClass?: string;
    active?: boolean;
}
