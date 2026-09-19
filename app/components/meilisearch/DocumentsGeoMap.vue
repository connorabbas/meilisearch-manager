<script setup lang="ts">
import type { Hit } from 'meilisearch'
import Popover from 'primevue/popover'
import { joinURL } from 'ufo'
import ThemedJsonViewer from '@/components/ThemedJsonViewer.vue'

type GeoPoint = {
    lat: number,
    lng: number,
}

type MappedGeoHit = {
    key: string,
    hit: Hit,
    point: GeoPoint,
}

const props = defineProps<{
    hits: Hit[],
    primaryKey?: string,
}>()

const DEFAULT_CENTER: [number, number] = [0, 0]
type PopoverType = InstanceType<typeof Popover>

const runtimeConfig = useRuntimeConfig()
const mapLightStyleUrl = joinURL(runtimeConfig.app.baseURL, 'styles/light-map.json')
const mapDarkStyleUrl = joinURL(runtimeConfig.app.baseURL, 'styles/dark-map.json')

const colorMode = useColorMode()
const mapStyleUrl = computed(() => colorMode.value === 'dark' ? mapDarkStyleUrl : mapLightStyleUrl)

const hoveredMarkerKey = ref<string | null>(null)
const selectedMarkerKey = ref<string | null>(null)
const documentPopover = useTemplateRef<PopoverType>('document-popover')
const isPopoverVisible = ref(false)
const isReanchoringPopover = ref(false)

function parseGeoPoint(hit: Hit): GeoPoint | null {
    const geoValue = hit._geo as { lat?: unknown, lng?: unknown } | undefined
    if (
        geoValue
        && typeof geoValue.lat === 'number'
        && Number.isFinite(geoValue.lat)
        && typeof geoValue.lng === 'number'
        && Number.isFinite(geoValue.lng)
    ) {
        return {
            lat: geoValue.lat,
            lng: geoValue.lng,
        }
    }

    const geojsonValue = hit._geojson as {
        type?: unknown,
        geometry?: {
            type?: unknown,
            coordinates?: unknown,
        },
    } | undefined

    const pointCoordinates = geojsonValue?.geometry?.coordinates
    if (
        geojsonValue?.type === 'Feature'
        && geojsonValue?.geometry?.type === 'Point'
        && Array.isArray(pointCoordinates)
        && pointCoordinates.length >= 2
    ) {
        const lng = Number(pointCoordinates[0])
        const lat = Number(pointCoordinates[1])
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng }
        }
    }

    return null
}

const geoHits = computed<MappedGeoHit[]>(() => {
    return props.hits.flatMap((hit, index) => {
        const point = parseGeoPoint(hit)
        if (!point) {
            return []
        }

        const keyValue = props.primaryKey ? hit[props.primaryKey] : null
        const key = keyValue !== null && keyValue !== undefined
            ? String(keyValue)
            : `geo-hit-${index}`

        return [{
            key,
            hit,
            point,
        }]
    })
})

const mapCenter = computed<[number, number]>(() => {
    if (geoHits.value.length === 0) {
        return DEFAULT_CENTER
    }

    const total = geoHits.value.reduce((result, current) => {
        return {
            lat: result.lat + current.point.lat,
            lng: result.lng + current.point.lng,
        }
    }, { lat: 0, lng: 0 })

    return [
        total.lng / geoHits.value.length,
        total.lat / geoHits.value.length,
    ]
})

const mapZoom = computed(() => {
    if (geoHits.value.length === 0) {
        return 2
    }

    if (geoHits.value.length === 1) {
        return 12
    }

    return 4
})

const mapBounds = computed<[[number, number], [number, number]] | undefined>(() => {
    if (geoHits.value.length < 2) {
        return undefined
    }

    let minLat = Number.POSITIVE_INFINITY
    let minLng = Number.POSITIVE_INFINITY
    let maxLat = Number.NEGATIVE_INFINITY
    let maxLng = Number.NEGATIVE_INFINITY

    geoHits.value.forEach((item) => {
        minLat = Math.min(minLat, item.point.lat)
        minLng = Math.min(minLng, item.point.lng)
        maxLat = Math.max(maxLat, item.point.lat)
        maxLng = Math.max(maxLng, item.point.lng)
    })

    return [[minLng, minLat], [maxLng, maxLat]]
})

const activeMarkerKey = computed(() => selectedMarkerKey.value ?? hoveredMarkerKey.value)
const selectedGeoHit = computed(() => {
    if (!selectedMarkerKey.value) {
        return null
    }

    return geoHits.value.find(item => item.key === selectedMarkerKey.value) ?? null
})

function handleMarkerHover(markerKey: string) {
    hoveredMarkerKey.value = markerKey
}

function handleMarkerLeave() {
    hoveredMarkerKey.value = null
}

function hideDocumentPopover() {
    if (documentPopover.value) {
        documentPopover.value.hide()
    }
    isPopoverVisible.value = false
    if (!isReanchoringPopover.value) {
        selectedMarkerKey.value = null
    }
}

function toggleDocumentPopover(event: Event, markerKey: string) {
    if (selectedMarkerKey.value === markerKey) {
        hideDocumentPopover()
        return
    }

    if (isPopoverVisible.value) {
        isReanchoringPopover.value = true
        documentPopover.value?.hide()
    }

    selectedMarkerKey.value = markerKey
    nextTick(() => {
        if (documentPopover.value) {
            documentPopover.value.show(event)
        }
    })
}

function handlePopoverShow() {
    isPopoverVisible.value = true
    isReanchoringPopover.value = false
}

function handlePopoverHide() {
    isPopoverVisible.value = false
    if (isReanchoringPopover.value) {
        return
    }

    selectedMarkerKey.value = null
}

watch(geoHits, () => {
    hoveredMarkerKey.value = null
    hideDocumentPopover()
})
</script>

<template>
    <div class="relative">
        <div class="relative rounded-xl overflow-hidden border dynamic-border">
            <MglMap
                :key="mapStyleUrl"
                :map-style="mapStyleUrl"
                :center="mapCenter"
                :zoom="mapZoom"
                :bounds="mapBounds"
                :fit-bounds-options="{ padding: 48, maxZoom: 14 }"
                :max-zoom="18"
                :min-zoom="2"
                height="560px"
                @map:move="hideDocumentPopover"
                @map:zoom="hideDocumentPopover"
            >
                <MglNavigationControl position="top-right" />
                <MglScaleControl />

                <MglMarker
                    v-for="geoHit in geoHits"
                    :key="geoHit.key"
                    :coordinates="[geoHit.point.lng, geoHit.point.lat]"
                    anchor="bottom"
                >
                    <template #marker>
                        <button
                            v-tooltip.top="`View details ${geoHit.key}`"
                            type="button"
                            class="inline-flex size-6 -translate-y-1.5 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg shadow-black/30 transition-transform duration-100 cursor-pointer"
                            :class="{ '-translate-y-2 scale-110': activeMarkerKey === geoHit.key }"
                            @mouseenter="handleMarkerHover(geoHit.key)"
                            @mouseleave="handleMarkerLeave"
                            @click.stop.prevent="toggleDocumentPopover($event, geoHit.key)"
                        >
                            <span class="size-2 rounded-full bg-white" />
                        </button>
                    </template>
                </MglMarker>
            </MglMap>

            <div
                v-if="geoHits.length === 0"
                class="absolute inset-0 flex items-center justify-center p-4 text-center bg-surface-0/90 dark:bg-surface-900/90"
            >
                <div class="max-w-[28rem] text-muted-color">
                    No point coordinates found in this page of results. Documents need `_geo` (or GeoJSON Point) values to be pinned on the map.
                </div>
            </div>
        </div>

        <Popover
            ref="document-popover"
            :pt="{
                root: { class: 'max-w-[28rem]' },
                content: { class: 'p-2 max-h-[20rem] overflow-y-auto' }
            }"
            @show="handlePopoverShow"
            @hide="handlePopoverHide"
        >
            <ThemedJsonViewer
                v-if="selectedGeoHit"
                class="rounded-border"
                :data="selectedGeoHit.hit"
                expanded
                :expandDepth="9999"
            />
        </Popover>

    </div>
</template>
