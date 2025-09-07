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

const { searchResults, search } = useSearch();
await search(props.indexUid);

// Filtering / Sorting / Pagination
const currentPage = ref(1);
const perPage = ref(20);
const firstDatasetIndex = computed(() => {
    return (currentPage.value - 1) * perPage.value;
});

const searchQuery = ref('');

function paginate(event: PageState) {
    console.log(event);
    if (event.rows !== perPage.value) {
        currentPage.value = 1;
    } else {
        currentPage.value = event.page + 1;
    }
    perPage.value = event.rows;

    const filterParams: SearchParams = {
        limit: perPage.value,
        offset: (perPage.value * currentPage.value) - perPage.value,
    };
    search(props.indexUid, searchQuery.value, filterParams).then(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    });
}
</script>

<template>
    <div class="space-y-4">
        <div
            v-if="searchResults?.hits.length"
            class="grid grid-cols-1 sm:grid-cols-12 gap-4"
        >
            <!-- TODO: primary key value as key -->
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
                @page="paginate"
            />
        </div>
    </div>
</template>