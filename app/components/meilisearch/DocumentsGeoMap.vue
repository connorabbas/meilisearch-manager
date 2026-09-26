<script setup lang="ts">
import type { Hit } from 'meilisearch'
import type { GeoPoint, MappedGeoHit } from '@/types'
import { joinURL } from 'ufo'
import ThemedJsonViewer from '@/components/ThemedJsonViewer.vue'

const props = defineProps<{ hits: Hit[], primaryKey?: string }>()
const runtimeConfig = useRuntimeConfig()
const colorMode = useColorMode()
const mapStyleUrl = computed(() => joinURL(
    runtimeConfig.app.baseURL,
    colorMode.value === 'dark' ? 'styles/dark-map.json' : 'styles/light-map.json',
))
const openMarkerKey = ref<string | null>(null)

function parseGeoPoint(hit: Hit): GeoPoint | null {
    const geo = hit._geo as { lat?: unknown, lng?: unknown } | undefined
    if (typeof geo?.lat === 'number' && Number.isFinite(geo.lat) && typeof geo.lng === 'number' && Number.isFinite(geo.lng)) {
        return { lat: geo.lat, lng: geo.lng }
    }
    const feature = hit._geojson as { type?: unknown, geometry?: { type?: unknown, coordinates?: unknown } } | undefined
    const coordinates = feature?.geometry?.coordinates
    if (feature?.type === 'Feature' && feature.geometry?.type === 'Point' && Array.isArray(coordinates)) {
        const lng = Number(coordinates[0])
        const lat = Number(coordinates[1])
        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
    }
    return null
}

const geoHits = computed<MappedGeoHit[]>(() => props.hits.flatMap((hit, index) => {
    const point = parseGeoPoint(hit)
    if (!point) return []
    const id = props.primaryKey ? hit[props.primaryKey] : null
    return [{ key: id == null ? `geo-hit-${index}` : String(id), hit, point }]
}))

const mapCenter = computed<[number, number]>(() => {
    if (!geoHits.value.length) return [0, 0]
    const sum = geoHits.value.reduce((value, item) => ({ lat: value.lat + item.point.lat, lng: value.lng + item.point.lng }), { lat: 0, lng: 0 })
    return [sum.lng / geoHits.value.length, sum.lat / geoHits.value.length]
})
const mapZoom = computed(() => geoHits.value.length === 0 ? 2 : geoHits.value.length === 1 ? 12 : 4)
const mapBounds = computed<[[number, number], [number, number]] | undefined>(() => {
    if (geoHits.value.length < 2) return undefined
    const lats = geoHits.value.map(item => item.point.lat)
    const lngs = geoHits.value.map(item => item.point.lng)
    return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]]
})

watch(geoHits, () => { openMarkerKey.value = null })
</script>

<template>
    <div class="relative flex min-h-0 flex-1 overflow-hidden rounded-lg border border-default">
        <MglMap
            :key="mapStyleUrl"
            :map-style="mapStyleUrl"
            :center="mapCenter"
            :zoom="mapZoom"
            :bounds="mapBounds"
            :fit-bounds-options="{ padding: 48, maxZoom: 14 }"
            :max-zoom="18"
            :min-zoom="2"
            height="100%"
            @map:move="openMarkerKey = null"
            @map:zoom="openMarkerKey = null"
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
                    <UPopover
                        :open="openMarkerKey === geoHit.key"
                        :content="{ side: 'top', collisionPadding: 16 }"
                        arrow
                        @update:open="openMarkerKey = $event ? geoHit.key : null"
                    >
                        <button
                            type="button"
                            :aria-label="`View document ${geoHit.key}`"
                            class="inline-flex size-7 -translate-y-1.5 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            :class="{ '-translate-y-2 scale-110': openMarkerKey === geoHit.key }"
                        >
                            <span class="size-2 rounded-full bg-white" />
                        </button>
                        <template #content>
                            <div class="max-h-80 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto p-2">
                                <ThemedJsonViewer
                                    :data="geoHit.hit"
                                    expanded
                                    :expand-depth="9999"
                                />
                            </div>
                        </template>
                    </UPopover>
                </template>
            </MglMarker>
        </MglMap>
        <div
            v-if="geoHits.length === 0"
            class="absolute inset-0 flex items-center justify-center bg-default/90 p-4 text-center"
        >
            <p class="max-w-md text-muted">No point coordinates found on this page. Documents need `_geo` or GeoJSON
                Point
                values to appear on the map.</p>
        </div>
    </div>
</template>
