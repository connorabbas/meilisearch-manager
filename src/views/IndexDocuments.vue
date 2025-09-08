<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSearch } from '@/composables/meilisearch/useSearch';
import type { Index } from 'meilisearch';
import DocumentHitCard from '@/components/meilisearch/DocumentHitCard.vue';
import NotFoundMessage from '@/components/NotFoundMessage.vue';
import { useStats } from '@/composables/meilisearch/useStats';
import { looksLikeAnImageUrl } from '@/utils';
import { Search, X } from 'lucide-vue-next';

const props = defineProps<{
    indexUid: string,
    index: Index,
}>();

const primaryKey = computed(() => props.index?.primaryKey);

const { indexStats, fetchIndexStats } = useStats();
const {
    searchResults,
    searchQuery,
    perPage,
    firstDatasetIndex,
    isFetching,
    statefulSearch,
    handlePageEvent,
} = useSearch();

async function fetchData() {
    await Promise.all([
        statefulSearch(props.indexUid),
        fetchIndexStats(props.indexUid),
    ]);
}
await fetchData();

const dataView = ref<'Grid' | 'Table'>('Grid');

function handleClearSearchQuery() {
    searchQuery.value = '';
    statefulSearch(props.indexUid);
}

</script>

<template>
    <div class="space-y-4">
        <Card>
            <template #content>
                <div class="flex justify-between gap-4">
                    <InputGroup>
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                        <!-- TODO: debounced @input search -->
                        <InputText
                            v-model="searchQuery"
                            placeholder="search query"
                            @keyup.enter="statefulSearch(props.indexUid)"
                        />
                        <Button
                            v-if="searchQuery"
                            v-tooltip="'Clear search query'"
                            severity="secondary"
                            outlined
                            @click="handleClearSearchQuery"
                        >
                            <template #icon>
                                <X />
                            </template>
                        </Button>
                        <!-- TODO: -->
                    </InputGroup>
                    <SelectButton
                        v-model="dataView"
                        :options="['Grid', 'Table']"
                    />
                </div>
            </template>
        </Card>

        <!-- Table view -->
        <Card v-show="dataView === 'Table'">
            <template #content>
                <DataTable
                    lazy
                    paginator
                    scrollable
                    :loading="isFetching"
                    :value="searchResults?.hits"
                    :rows="perPage"
                    :first="firstDatasetIndex"
                    :totalRecords="searchResults?.estimatedTotalHits"
                    :rowsPerPageOptions="[10, 20, 50, 100]"
                    scrollHeight="500px"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    @page="(event) => handlePageEvent(props.indexUid, event, false)"
                >
                    <template #empty>
                        <NotFoundMessage subject="Documents" />
                    </template>
                    <Column
                        v-for="field in Object.keys(indexStats?.fieldDistribution ?? {})"
                        :key="field"
                        :field
                        :header="field"
                    >
                        <template #body="{ data }">
                            <Image
                                v-if="looksLikeAnImageUrl(data[field])"
                                :src="data[field]"
                                alt="Document Image"
                                pt:image:class="max-h-20 rounded-lg"
                                preview
                            />
                            <div
                                v-else
                                class="truncate w-[200px]"
                            >
                                {{ data[field] }}
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <!-- Grid View -->
        <BlockUI
            v-show="dataView === 'Grid'"
            :blocked="isFetching"
        >
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
        </BlockUI>
    </div>
</template>