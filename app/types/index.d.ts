import type { RouteLocationRaw } from 'vue-router'
import type { DataTableFilterMetaData } from 'primevue'
import type { MenuItem as PrimeVueMenuItem } from 'primevue/menuitem'
import type { LucideIcon } from '@lucide/vue'
import type {
    Embedder,
    RecordAny,
    SearchRuleAction,
    SearchRuleConditions,
    SearchRuleQueryCondition,
    SearchRuleTimeCondition,
} from 'meilisearch'

export type PrimeVueDataFilters = {
    [key: string]: DataTableFilterMetaData;
};

export interface MenuItem extends PrimeVueMenuItem {
    route?: RouteLocationRaw;
    lucideIcon?: LucideIcon;
    lucideIconClass?: string;
    active?: boolean;
}

export type IndexEmbedderOption = {
    name: string;
    label: string;
    settings: NonNullable<Embedder>;
}

export type SearchRuleFormState = {
    uid: string;
    description: string;
    precedence: number | null;
    active: boolean;
    conditions: SearchRuleConditions;
    actions: SearchRuleAction[];
};

export type SearchRuleConditionEntry =
    | { scope: 'query'; condition: SearchRuleQueryCondition }
    | { scope: 'time'; condition: SearchRuleTimeCondition };

export type SearchRuleDocumentOption = {
    label: string;
    value: string;
    preview: string;
    document: RecordAny;
    onSelect: () => void;
};
