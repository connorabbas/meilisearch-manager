import type {
    Embedder,
    RecordAny,
    SearchRuleAction,
    SearchRuleConditions,
    SearchRuleQueryCondition,
    SearchRuleTimeCondition,
} from 'meilisearch'

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
