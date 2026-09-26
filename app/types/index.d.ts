import type {
    Embedder,
    FacetHit,
    Hit,
    IndexObject,
    RecordAny,
    SearchRuleAction,
    SearchRuleConditions,
    SearchRuleQueryCondition,
    SearchRuleTimeCondition,
} from 'meilisearch'

export interface MeilisearchInstanceConfig {
    id: string;
    name: string;
    host: string;
    apiKey: string;
}

export interface PaginationOptions {
    total?: () => number | null | undefined;
    itemLabel?: string;
}

export interface ConfirmActionOptions {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

export type TaskStatusColor = 'success' | 'info' | 'neutral' | 'error' | 'warning'
export type SearchPaginationState = { maxTotalHits?: import('vue').Ref<number | null | undefined> }
export type FacetFilterGroup = { attribute: string; facetHits: FacetHit[]; value: string[] }
export type GeoFilterMode = 'none' | 'radius' | 'boundingBox' | 'polygon'
export type GeoSortDirection = 'none' | 'asc' | 'desc'
export type NewInstanceForm = { name: string; host: string; apiKey: string }
export type CreateIndexForm = { uid: string; primaryKey?: string }
export type IndexRow = IndexObject & { numberOfDocuments: number }
export type CreateKeyFormState = {
    uid?: string;
    name?: string;
    description?: string;
    indexes: string[];
    actions: string[];
    expiresAt: Date | null;
}
export type GeoPoint = { lat: number; lng: number }
export type MappedGeoHit = { key: string; hit: Hit; point: GeoPoint }
export type DocumentDataView = 'json' | 'table' | 'geo'
export type SortOption = { value: string; label: string }

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
