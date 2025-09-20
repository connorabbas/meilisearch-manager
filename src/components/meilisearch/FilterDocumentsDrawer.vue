<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFacetSearch } from '@/composables/meilisearch/useFacetSearch';
import { FacetHit, Filter, FilterableAttributes } from 'meilisearch';

const props = defineProps<{
    indexUid: string,
    filterableAttributes?: FilterableAttributes | null,
    searching?: boolean,
    totalHits?: number,
}>();

const drawerOpen = defineModel<boolean>({ default: false });
const filter = defineModel<Filter | null>('filter', { required: true });

const emit = defineEmits(['hide', 'searched']);

const { searchFacetValues } = useFacetSearch();

const selectedAttributes = ref([]);
type FacetFilterGroup = {
    attribute: string,
    facetHits: FacetHit[],
    value: string[],
}
const facetFilters = ref<Record<string, FacetFilterGroup>>({});
const facetFiltersEmpty = computed(() => Object.keys(facetFilters.value).length === 0);

function handleHideDrawer() {
    emit('hide');
}

watch(selectedAttributes, async (newVal, oldVal) => {
    const added = newVal.filter(item => !oldVal?.includes(item));
    const removed = oldVal?.filter(item => !newVal.includes(item)) || [];

    // populate the facet filters when attributes are checked
    if (added.length > 0) {
        added.forEach(async (attributeName) => {
            const result = await searchFacetValues(props.indexUid, {
                facetName: attributeName,
            });
            facetFilters.value[attributeName] = {
                attribute: attributeName,
                facetHits: result?.facetHits ?? [],
                value: [],
            };
            console.log(`fetching: ${attributeName} facet values`);
        });
    }

    // remove facet filters when un-checked
    if (removed.length > 0) {
        removed.forEach((attributeName) => {
            console.log(`Unchecked: ${attributeName}`);
            delete facetFilters.value[attributeName];
        });
    }
});
watch(facetFilters, (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
        const filterExpressions: string[] = [];

        Object.values(newVal).forEach((facetGroup) => {
            if (facetGroup.value.length > 0) {
                // For each attribute with selected values, create OR conditions within parentheses
                const attributeFilters = facetGroup.value
                    .map(value => `${facetGroup.attribute} = '${value}'`)
                    .join(' OR ');

                if (attributeFilters) {
                    filterExpressions.push(`(${attributeFilters})`);
                }
            }
        });

        // Join all attribute groups with AND
        const finalFilter = filterExpressions.length > 0
            ? filterExpressions.join(' AND ')
            : null;

        filter.value = finalFilter;
        console.log('Generated filter:', finalFilter);
    } else {
        filter.value = null;
    }
}, { deep: true });
</script>

<template>
    <!-- TODO: drawer covers instance dd menu -->
    <Drawer
        v-model:visible="drawerOpen"
        :modal="false"
        :blockScroll="false"
        :dismissable="false"
        :autoZIndex="false"
        header="Filter Documents"
        class="z-1000! w-full sm:w-[30rem] top-0 sm:top-[var(--header-height)]"
        pt:footer:class="mb-0 sm:mb-[var(--header-height)]"
        pt:mask:class="z-1000!"
        position="right"
        @hide="handleHideDrawer"
    >
        <div class="relative flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <label for="filterable-attributes">Facets</label>
                <MultiSelect
                    v-model="selectedAttributes"
                    :options="(filterableAttributes as string[])"
                    pt:label:class="flex flex-wrap"
                    placeholder="Select facets to filter on"
                    inputId="filterable-attributes"
                    display="chip"
                    appendTo="self"
                    showClear
                    fluid
                />
            </div>
            <Divider v-if="!facetFiltersEmpty" />
            <div
                v-if="!facetFiltersEmpty"
                class="flex flex-col gap-6"
            >
                <div
                    v-for="facetFilter in facetFilters"
                    :key="facetFilter.attribute"
                    class="flex flex-col gap-2"
                >
                    <label :for="`${facetFilter.attribute}_id`">{{ facetFilter.attribute }}</label>
                    <div class="relative">
                        <MultiSelect
                            v-model="facetFilters[facetFilter.attribute].value"
                            :options="facetFilter.facetHits"
                            :inputId="`${facetFilter.attribute}_id`"
                            :showToggleAll="false"
                            :disabled="props.searching"
                            filterPlaceholder="Search for facet values"
                            pt:label:class="flex flex-wrap"
                            pt:overlay:class="w-full"
                            optionValue="value"
                            optionLabel="value"
                            display="chip"
                            appendTo="self"
                            showClear
                            filter
                            fluid
                        >
                            <template #option="{ option }">
                                {{ option.value }} ({{ option.count }})
                            </template>
                        </MultiSelect>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div
                v-if="props.totalHits"
                class="flex justify-center text-muted-color text-sm"
            >
                {{ props.totalHits.toLocaleString('en-US') }} estimated total hits
            </div>
        </template>
    </Drawer>
</template>
