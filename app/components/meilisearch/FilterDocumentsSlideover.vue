<script setup lang="ts">
import { useFacetSearch } from '@/composables/meilisearch/useFacetSearch'
import type { Filter, FilterableAttributes, SortableAttributes } from 'meilisearch'
import type { FacetFilterGroup, GeoFilterMode, GeoSortDirection } from '@/types'

const props = defineProps<{
    indexUid: string,
    filterableAttributes?: FilterableAttributes | null,
    sortableAttributes?: SortableAttributes | null,
    searching?: boolean,
    totalHits?: number,
    enableGeoFilters?: boolean,
}>()

const open = defineModel<boolean>('open', { default: false })
const filter = defineModel<Filter | null>('filter', { required: true })
const geoSort = defineModel<string | null>('geoSort', { default: null })

const { searchFacetValues } = useFacetSearch()

const selectedAttributes = ref<string[]>([])
const facetFilters = ref<Record<string, FacetFilterGroup>>({})
const facetFiltersEmpty = computed(() => Object.keys(facetFilters.value).length === 0)

const facetAttributeOptions = computed(() => {
    return ((props.filterableAttributes as string[]) ?? []).filter(attribute => attribute !== '_geo')
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
    return ((props.filterableAttributes as string[]) ?? []).includes('_geo')
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

function escapeFilterValue(value: string) {
    return value.replaceAll('\'', '\\\'')
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
        if (lat === null || lng === null) {
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
                .map(value => `${facetGroup.attribute} = '${escapeFilterValue(value)}'`)
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
        if (lat === null || lng === null || meters === null) {
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
        if (lat === null || lng === null || meters === null || meters <= 0) {
            return 'Radius values must be valid numbers and radius must be greater than 0.'
        }
    }

    if (geoFilterMode.value === 'boundingBox') {
        const values = [boxTopLeftLat.value, boxTopLeftLng.value, boxBottomRightLat.value, boxBottomRightLng.value]
        if (values.some(value => !value.trim())) {
            return 'Enter top-left and bottom-right latitude/longitude values.'
        }

        const parsedValues = values.map(parseNumberValue)
        if (parsedValues.some(value => value === null)) {
            return 'Bounding box coordinates must be valid numbers.'
        }
    }

    if (geoFilterMode.value === 'polygon') {
        if (!polygonPointsInput.value.trim()) {
            return 'Enter at least 3 lines with "lat,lng" coordinates.'
        }

        if (!parsePolygonCoordinates(polygonPointsInput.value)) {
            return 'Polygon format must be one "lat,lng" coordinate pair per line, at least 3 points.'
        }
    }

    return null
})

const combinedFilterExpression = computed<string | null>(() => {
    const expressions = [facetFilterExpression.value, geoFilterExpression.value].filter(Boolean)
    if (expressions.length === 0) {
        return null
    }

    return expressions.join(' AND ')
})

const geoSortExpression = computed<string | null>(() => {
    if (!props.enableGeoFilters || geoSortDirection.value === 'none' || !hasGeoSortSupport.value) {
        return null
    }

    const lat = parseNumberValue(geoSortLat.value)
    const lng = parseNumberValue(geoSortLng.value)
    if (lat === null || lng === null) {
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
    if (lat === null || lng === null) {
        return 'Geo sort coordinates must be valid numbers.'
    }

    return null
})

watch(selectedAttributes, async (newVal, oldVal) => {
    const added = newVal.filter(item => !oldVal?.includes(item))
    const removed = oldVal?.filter(item => !newVal.includes(item)) || []

    // populate the facet filters when attributes are checked
    if (added.length > 0) {
        await Promise.all(added.map(async (attributeName) => {
            const result = await searchFacetValues(props.indexUid, {
                facetName: attributeName,
            })
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
            const nextFacetFilters = { ...facetFilters.value }

            Reflect.deleteProperty(nextFacetFilters, attributeName)
            facetFilters.value = nextFacetFilters
        })
    }
})
watch(combinedFilterExpression, (newVal) => {
    filter.value = newVal
}, { immediate: true })

watch(geoSortExpression, (newVal) => {
    geoSort.value = newVal
}, { immediate: true })

watch(() => props.enableGeoFilters, (enabled) => {
    if (!enabled) {
        geoFilterMode.value = 'none'
        geoSortDirection.value = 'none'
    }
})
</script>

<template>
    <USlideover
        v-model:open="open"
        title="Filter Documents"
        :ui="{ content: 'sm:max-w-lg' }"
    >
        <template #body>
            <!-- TODO: manual input search -->
            <div class="mt-1 relative flex flex-col gap-4">
                <UAlert
                    v-if="facetAttributeOptions.length === 0"
                    variant="subtle"
                    color="warning"
                    icon="i-lucide-triangle-alert"
                    title="No facet filters available"
                    description="Update the filterableAttributes index setting to filter by facets."
                />
                <UFormField
                    v-if="facetAttributeOptions.length > 0"
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
                <USeparator v-if="!facetFiltersEmpty" />
                <div
                    v-if="!facetFiltersEmpty"
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
                                value-key="value"
                                label-key="value"
                                :aria-label="`${facetFilter.attribute} values`"
                                multiple
                                clear
                                class="w-full"
                                @update:model-value="(value) => updateFacetFilterValue(facetFilter.attribute, value)"
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
            <div
                v-if="props.totalHits"
                class="flex justify-center text-muted"
            >
                {{ props.totalHits.toLocaleString('en-US') }} estimated total hits
            </div>
        </template>
    </USlideover>
</template>
