<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSearch } from '@/composables/meilisearch/useSearch';
import type { Index, SearchParams } from 'meilisearch';
import type { PageState } from 'primevue';
import DocumentHitCard from '@/components/meilisearch/DocumentHitCard.vue';
import NotFoundMessage from '@/components/NotFoundMessage.vue';

const props = defineProps<{
    indexUid: string,
    index: Index,
}>();

const primaryKey = computed(() => props.index?.primaryKey);

const {
    searchResults,
    perPage,
    firstDatasetIndex,
    search,
    handlePageEvent,
} = useSearch();
await search(props.indexUid);
</script>

<template>
    <div class="space-y-4">
        <div
            v-if="searchResults?.hits.length"
            class="grid grid-cols-1 sm:grid-cols-12 gap-4"
        >
            <div
                v-for="hit, hitIndex in searchResults.hits"
                :key="(primaryKey && hit[primaryKey]) ?? hitIndex"
                class="sm:col-span-6 lg:col-span-3"
            >
                <DocumentHitCard :hit />
            </div>
        </div>
        <div v-else>
            <NotFoundMessage subject="Document" />
        </div>
        <div v-if="searchResults?.hits.length">
            <Paginator
                :rows="perPage"
                :first="firstDatasetIndex"
                :totalRecords="searchResults?.estimatedTotalHits"
                :rowsPerPageOptions="[20, 50, 100]"
                template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                @page="(event) => handlePageEvent(props.indexUid, event)"
            />
        </div>
    </div>
</template>