<script setup lang="ts">
import { useFacetSearch } from '@/composables/meilisearch/useFacetSearch'
import type { Filter, FilterableAttributes, SortableAttributes } from 'meilisearch'
import type { FacetFilterGroup, GeoFilterMode, GeoSortDirection } from '@/types'
import DocumentFilterBuilder from '@/components/meilisearch/DocumentFilterBuilder.vue'
import { compileGroups, createFilterBuilderState, filterFields, quoteFilterField, quoteFilterValue } from '@/utils/documentFilters'
import { isVersionAtLeast } from '@/utils'

const props = defineProps<{
    indexUid: string,
    filterableAttributes?: FilterableAttributes | null,
    sortableAttributes?: SortableAttributes | null,
    searching?: boolean,
    enableGeoFilters?: boolean,
    knownFields?: string[],
    version?: string | null,
    searchQuery?: string,
}>()

const open = defineModel<boolean>('open', { default: false })
const filter = defineModel<Filter | null>('filter', { required: true })
const geoSort = defineModel<string | null>('geoSort', { default: null })

const { searchFacetValues } = useFacetSearch()

const selectedAttributes = ref<string[]>([])
const facetFilters = ref<Record<string, FacetFilterGroup>>({})
const facetTimers = new Map<string, ReturnType<typeof setTimeout>>()
const facetRequestIds = new Map<string, number>()
const facetQueries = new Map<string, string>()
const facetFiltersEmpty = computed(() => Object.keys(facetFilters.value).length === 0)
const mode = ref<'facets' | 'builder'>('facets')
const modes = [
    { label: 'Facets', value: 'facets' },
    { label: 'Builder', value: 'builder' },
]
const builderState = ref(createFilterBuilderState())
const appliedAttributeFilter = ref<string | null>(null)
const availableFields = computed(() => filterFields(props.filterableAttributes, props.knownFields ?? []))
const builderFields = computed(() => availableFields.value.filter(field => field.equality || field.comparison))
const builderExpression = computed(() => {
    try {
        return { value: compileGroups(builderState.value.groups, builderState.value.join, builderFields.value, props.version ?? null), error: null }
    } catch (error) {
        return { value: null, error: (error as Error).message }
    }
})

const facetAttributeOptions = computed(() => {
    return availableFields.value.filter(field => field.facetSearch && field.equality).map(field => field.name)
})

const geoFilterMode = ref<GeoFilterMode>('none')
const geoFilterModeOptions = [
    { label: 'None', value: 'none' },
    { label: 'Radius', value: 'radius' },
    { label: 'Bounding Box', value: 'boundingBox' },
    { label: 'Polygon', value: 'polygon' },
]

const radiusLat = ref('')
const radiusLng = ref('')
const radiusMeters = ref('')

const boxTopLeftLat = ref('')
const boxTopLeftLng = ref('')
const boxBottomRightLat = ref('')
const boxBottomRightLng = ref('')

const polygonPointsInput = ref('')

const geoSortDirection = ref<GeoSortDirection>('none')
const geoSortDirectionOptions = [
    { label: 'None', value: 'none' },
    { label: 'Nearest First', value: 'asc' },
    { label: 'Farthest First', value: 'desc' },
]
const geoSortLat = ref('')
const geoSortLng = ref('')

const hasGeoFilterSupport = computed(() => {
    return (props.filterableAttributes ?? []).some(entry => typeof entry === 'string'
        ? entry === '_geo' || entry === '*'
        : entry.attributePatterns.includes('_geo') || entry.attributePatterns.includes('*'))
})
const hasGeoSortSupport = computed(() => {
    return ((props.sortableAttributes as string[]) ?? []).includes('_geo')
})

function updateFacetFilterValue(attributeName: string, value: string[]) {
    const facetFilter = facetFilters.value[attributeName]

    if (!facetFilter) {
        return
    }

    facetFilter.value = value
}

function searchFacet(attribute: string, query: string) {
    if (facetQueries.get(attribute) === query || (!facetQueries.has(attribute) && !query)) return
    facetQueries.set(attribute, query)
    const pending = facetTimers.get(attribute)
    if (pending) clearTimeout(pending)
    const requestId = (facetRequestIds.get(attribute) ?? 0) + 1
    facetRequestIds.set(attribute, requestId)
    facetTimers.set(attribute, setTimeout(async () => {
        const otherFilters = Object.values(facetFilters.value).filter(group => group.attribute !== attribute && group.value.length)
            .map(group => `(${group.value.map(value => `${quoteFilterField(group.attribute)} = ${quoteFilterValue(value)}`).join(' OR ')})`).join(' AND ')
        const indexUid = props.indexUid
        const result = await searchFacetValues(indexUid, {
            facetName: attribute,
            facetQuery: query,
            q: props.searchQuery,
            filter: otherFilters || undefined,
        })
        const current = facetFilters.value[attribute]
        if (!current || !selectedAttributes.value.includes(attribute) || indexUid !== props.indexUid || facetRequestIds.get(attribute) !== requestId) return
        current.facetHits = [
            ...(result?.facetHits ?? []),
            ...current.facetHits.filter(hit => current.value.includes(hit.value) && !result?.facetHits.some(item => item.value === hit.value)),
        ]
    }, 250))
}

function parseNumberValue(value: string): number | null {
    if (!value.trim()) {
        return null
    }

    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
        return null
    }

    return parsed
}

function parsePolygonCoordinates(value: string): Array<[number, number]> | null {
    const points = value
        .split(/\r?\n/g)
        .map(line => line.trim())
        .filter(Boolean)

    if (points.length < 3) {
        return null
    }

    const coordinates: Array<[number, number]> = []
    for (const point of points) {
        const [latInput, lngInput] = point.split(',').map(part => part.trim())
        if (!latInput || !lngInput) {
            return null
        }

        const lat = parseNumberValue(latInput)
        const lng = parseNumberValue(lngInput)
        if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return null
        }

        coordinates.push([lat, lng])
    }

    return coordinates
}

const facetFilterExpression = computed<string | null>(() => {
    if (!facetFilters.value || Object.keys(facetFilters.value).length === 0) {
        return null
    }

    const filterExpressions: string[] = []
    Object.values(facetFilters.value).forEach((facetGroup) => {
        if (facetGroup.value.length > 0) {
            const attributeFilters = facetGroup.value
                .map(value => `${quoteFilterField(facetGroup.attribute)} = ${quoteFilterValue(value)}`)
                .join(' OR ')

            if (attributeFilters) {
                filterExpressions.push(`(${attributeFilters})`)
            }
        }
    })

    return filterExpressions.length > 0 ? filterExpressions.join(' AND ') : null
})

const geoFilterExpression = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoFilterMode.value === 'none' || !hasGeoFilterSupport.value) {
        return null
    }

    if (geoFilterMode.value === 'radius') {
        const lat = parseNumberValue(radiusLat.value)
        const lng = parseNumberValue(radiusLng.value)
        const meters = parseNumberValue(radiusMeters.value)
        if (lat === null || lng === null || meters === null || meters <= 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return null
        }

        return `_geoRadius(${lat}, ${lng}, ${Math.round(meters)})`
    }

    if (geoFilterMode.value === 'boundingBox') {
        const topLeftLat = parseNumberValue(boxTopLeftLat.value)
        const topLeftLng = parseNumberValue(boxTopLeftLng.value)
        const bottomRightLat = parseNumberValue(boxBottomRightLat.value)
        const bottomRightLng = parseNumberValue(boxBottomRightLng.value)
        if (
            topLeftLat === null
            || topLeftLng === null
            || bottomRightLat === null
            || bottomRightLng === null
        ) {
            return null
        }

        return `_geoBoundingBox([${topLeftLat}, ${topLeftLng}], [${bottomRightLat}, ${bottomRightLng}])`
    }

    if (geoFilterMode.value === 'polygon') {
        const coordinates = parsePolygonCoordinates(polygonPointsInput.value)
        if (!coordinates) {
            return null
        }

        const points = coordinates.map(([lat, lng]) => `[${lat}, ${lng}]`).join(', ')
        return `_geoPolygon(${points})`
    }

    return null
})

const geoFilterValidationMessage = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoFilterMode.value === 'none') {
        return null
    }
    if (!hasGeoFilterSupport.value) {
        return 'Geo filtering requires "_geo" in filterableAttributes.'
    }

    if (geoFilterMode.value === 'radius') {
        if (!radiusLat.value.trim() || !radiusLng.value.trim() || !radiusMeters.value.trim()) {
            return 'Enter latitude, longitude, and radius in meters.'
        }

        const lat = parseNumberValue(radiusLat.value)
        const lng = parseNumberValue(radiusLng.value)
        const meters = parseNumberValue(radiusMeters.value)
        if (lat === null || lng === null || meters === null || meters <= 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return 'Radius values must be valid numbers and radius must be greater than 0.'
        }
    }

    if (geoFilterMode.value === 'boundingBox') {
        const values = [boxTopLeftLat.value, boxTopLeftLng.value, boxBottomRightLat.value, boxBottomRightLng.value]
        if (values.some(value => !value.trim())) {
            return 'Enter top-left and bottom-right latitude/longitude values.'
        }

        const parsedValues = values.map(parseNumberValue)
        if (parsedValues.some(value => value === null) || Math.abs(parsedValues[0]!) > 90 || Math.abs(parsedValues[2]!) > 90 || Math.abs(parsedValues[1]!) > 180 || Math.abs(parsedValues[3]!) > 180) {
            return 'Bounding box coordinates must be valid numbers.'
        }
    }

    if (geoFilterMode.value === 'polygon') {
        if (!props.version || !isVersionAtLeast(props.version, '1.22.0')) {
            return 'Polygon filtering requires Meilisearch 1.22 or later.'
        }
        if (!polygonPointsInput.value.trim()) {
            return 'Enter at least 3 lines with "lat,lng" coordinates.'
        }

        if (!parsePolygonCoordinates(polygonPointsInput.value)) {
            return 'Polygon format must be one "lat,lng" coordinate pair per line, at least 3 points.'
        }
    }

    return null
})

const geoSortExpression = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoSortDirection.value === 'none' || !hasGeoSortSupport.value) {
        return null
    }

    const lat = parseNumberValue(geoSortLat.value)
    const lng = parseNumberValue(geoSortLng.value)
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return null
    }

    return `_geoPoint(${lat}, ${lng}):${geoSortDirection.value}`
})

const geoSortValidationMessage = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoSortDirection.value === 'none') {
        return null
    }
    if (!hasGeoSortSupport.value) {
        return 'Geo sorting requires "_geo" in sortableAttributes.'
    }

    if (!geoSortLat.value.trim() || !geoSortLng.value.trim()) {
        return 'Enter latitude and longitude for geo sorting.'
    }

    const lat = parseNumberValue(geoSortLat.value)
    const lng = parseNumberValue(geoSortLng.value)
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return 'Geo sort coordinates must be valid numbers.'
    }

    return null
})

const draftFilter = computed(() => {
    const attributeFilter = mode.value === 'facets' ? facetFilterExpression.value : builderExpression.value.value
    const geo = geoFilterExpression.value
    if (attributeFilter && geo) return `${mode.value === 'builder' ? `(${attributeFilter})` : attributeFilter} AND ${geo}`
    return attributeFilter || geo
})
const applyDisabled = computed(() => !!builderExpression.value.error && mode.value === 'builder'
    || !!geoFilterValidationMessage.value || !!geoSortValidationMessage.value
    || (draftFilter.value === filter.value && geoSortExpression.value === geoSort.value))

function applyFilters() {
    if (applyDisabled.value) return
    appliedAttributeFilter.value = mode.value === 'facets' ? facetFilterExpression.value : builderExpression.value.value
    filter.value = draftFilter.value
    geoSort.value = geoSortExpression.value
    open.value = false
}

watch(selectedAttributes, async (newVal, oldVal) => {
    const added = newVal.filter(item => !oldVal?.includes(item))
    const removed = oldVal?.filter(item => !newVal.includes(item)) || []

    // populate the facet filters when attributes are checked
    if (added.length > 0) {
        await Promise.all(added.map(async (attributeName) => {
            const result = await searchFacetValues(props.indexUid, {
                facetName: attributeName,
            })
            if (!selectedAttributes.value.includes(attributeName) || mode.value !== 'facets') return
            facetFilters.value[attributeName] = {
                attribute: attributeName,
                facetHits: result?.facetHits ?? [],
                value: [],
            }
        }))
    }

    // remove facet filters when un-checked
    if (removed.length > 0) {
        removed.forEach((attributeName) => {
            clearTimeout(facetTimers.get(attributeName))
            facetRequestIds.set(attributeName, (facetRequestIds.get(attributeName) ?? 0) + 1)
            facetQueries.delete(attributeName)
            const nextFacetFilters = { ...facetFilters.value }

            Reflect.deleteProperty(nextFacetFilters, attributeName)
            facetFilters.value = nextFacetFilters
        })
    }
})
function switchMode(value: 'facets' | 'builder') {
    if (mode.value === value) return
    selectedAttributes.value = []
    for (const timer of facetTimers.values()) clearTimeout(timer)
    facetRequestIds.clear()
    facetQueries.clear()
    facetFilters.value = {}
    appliedAttributeFilter.value = null
    builderState.value = createFilterBuilderState()
    geoFilterMode.value = 'none'
    geoSortDirection.value = 'none'
    filter.value = null
    geoSort.value = null
    mode.value = value
}

watch(() => props.enableGeoFilters, (enabled) => {
    if (!enabled) {
        geoFilterMode.value = 'none'
        geoSortDirection.value = 'none'
        filter.value = appliedAttributeFilter.value
        geoSort.value = null
    }
})
watch(() => props.indexUid, () => {
    selectedAttributes.value = []
    facetFilters.value = {}
    appliedAttributeFilter.value = null
    builderState.value = createFilterBuilderState()
    geoFilterMode.value = 'none'
    geoSortDirection.value = 'none'
    mode.value = 'facets'
    filter.value = null
    geoSort.value = null
})
onBeforeUnmount(() => {
    for (const timer of facetTimers.values()) clearTimeout(timer)
})
</script>

<template>
    <USlideover
        v-model:open="open"
        title="Filter Documents"
        :ui="{ content: 'max-w-none lg:max-w-3xl' }"
    >
        <template #body>
            <div class="mt-1 relative flex flex-col gap-4">
                <UTabs
                    :model-value="mode"
                    :items="modes"
                    :content="false"
                    aria-label="Filter mode"
                    class="w-full"
                    @update:model-value="switchMode($event as 'facets' | 'builder')"
                />
                <DocumentFilterBuilder
                    v-if="mode === 'builder'"
                    v-model:state="builderState"
                    :fields="builderFields"
                    :version="props.version ?? null"
                    :expression="builderExpression"
                />
                <UAlert
                    v-if="mode === 'facets' && facetAttributeOptions.length === 0"
                    variant="subtle"
                    color="warning"
                    icon="i-lucide-triangle-alert"
                    title="No facet filters available"
                    description="Update the filterableAttributes index setting to filter by facets."
                />
                <UFormField
                    v-if="mode === 'facets' && facetAttributeOptions.length > 0"
                    label="Facets"
                >
                    <USelectMenu
                        v-model="selectedAttributes"
                        :items="facetAttributeOptions"
                        placeholder="Select facets to filter on"
                        aria-label="Filterable facets"
                        multiple
                        clear
                        class="w-full"
                    />
                </UFormField>
                <USeparator v-if="mode === 'facets' && !facetFiltersEmpty" />
                <div
                    v-if="mode === 'facets' && !facetFiltersEmpty"
                    class="flex flex-col gap-6"
                >
                    <div
                        v-for="facetFilter in facetFilters"
                        :key="facetFilter.attribute"
                        class="space-y-2"
                    >
                        <UFormField :label="facetFilter.attribute">
                            <USelectMenu
                                :model-value="facetFilter.value"
                                :items="facetFilter.facetHits"
                                :disabled="props.searching"
                                :search-input="{ placeholder: 'Search facet values' }"
                                :ignore-filter="true"
                                value-key="value"
                                label-key="value"
                                :aria-label="`${facetFilter.attribute} values`"
                                multiple
                                clear
                                class="w-full"
                                @update:model-value="(value) => updateFacetFilterValue(facetFilter.attribute, value)"
                                @update:search-term="(value) => searchFacet(facetFilter.attribute, value)"
                            >
                                <template #item-label="{ item }">{{ item.value }} ({{ item.count }})</template>
                            </USelectMenu>
                        </UFormField>
                    </div>
                </div>

                <template v-if="props.enableGeoFilters">
                    <USeparator />
                    <UFormField
                        label="Geo filter"
                        description="Use Meilisearch geo filters with manual coordinates."
                    >
                        <USelect
                            v-model="geoFilterMode"
                            :items="geoFilterModeOptions"
                            class="w-full"
                        />
                    </UFormField>

                    <div
                        v-if="geoFilterMode === 'radius'"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <UFormField label="Latitude">
                            <UInput
                                v-model="radiusLat"
                                placeholder="45.472735"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Longitude">
                            <UInput
                                v-model="radiusLng"
                                placeholder="9.184019"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField
                            label="Radius (meters)"
                            class="sm:col-span-2"
                        >
                            <UInput
                                v-model="radiusMeters"
                                placeholder="2000"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <div
                        v-else-if="geoFilterMode === 'boundingBox'"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <UFormField label="Top-left latitude">
                            <UInput
                                v-model="boxTopLeftLat"
                                placeholder="45.494181"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Top-left longitude">
                            <UInput
                                v-model="boxTopLeftLng"
                                placeholder="9.214024"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Bottom-right latitude">
                            <UInput
                                v-model="boxBottomRightLat"
                                placeholder="45.449484"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Bottom-right longitude">
                            <UInput
                                v-model="boxBottomRightLng"
                                placeholder="9.179175"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <UFormField
                        v-else-if="geoFilterMode === 'polygon'"
                        label="Polygon points (lat,lng per line)"
                    >
                        <UTextarea
                            v-model="polygonPointsInput"
                            :rows="6"
                            placeholder="45.490, 9.170&#10;45.490, 9.210&#10;45.450, 9.190"
                            class="w-full"
                        />
                    </UFormField>

                    <UAlert
                        v-if="geoFilterValidationMessage"
                        variant="subtle"
                        color="warning"
                        icon="i-lucide-triangle-alert"
                        :description="geoFilterValidationMessage"
                    />

                    <USeparator />

                    <UFormField label="Geo sort">
                        <USelect
                            v-model="geoSortDirection"
                            :items="geoSortDirectionOptions"
                            class="w-full"
                        />
                    </UFormField>

                    <div
                        v-if="geoSortDirection !== 'none'"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        <UFormField label="Reference latitude">
                            <UInput
                                v-model="geoSortLat"
                                placeholder="48.8561446"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="Reference longitude">
                            <UInput
                                v-model="geoSortLng"
                                placeholder="2.2978204"
                                class="w-full"
                            />
                        </UFormField>
                    </div>

                    <UAlert
                        v-if="geoSortValidationMessage"
                        variant="subtle"
                        color="warning"
                        icon="i-lucide-triangle-alert"
                        :description="geoSortValidationMessage"
                    />
                </template>
            </div>
        </template>
        <template #footer>
            <div class="flex w-full justify-end">
                <UButton
                    label="Apply filters"
                    :disabled="applyDisabled"
                    @click="applyFilters"
                />
            </div>
        </template>
    </USlideover>
</template>
