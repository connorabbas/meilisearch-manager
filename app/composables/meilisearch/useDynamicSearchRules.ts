import { useMeilisearchStore } from '@/stores/meilisearch'
import { usePagination } from '../usePagination'
import type { SearchRule, SearchRuleListPayload, SearchRuleListFilterPayload, ResourceResults, SearchRuleUpdatePayload } from 'meilisearch'

export function useDynamicSearchRules(initialPerPage: number = 20) {
    const toast = useToast()
    const { confirmAction } = useConfirmAction()
    const meilisearchStore = useMeilisearchStore()
    const {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        syncCurrentPageWithinTotal,
        handlePageEvent,
    } = usePagination(initialPerPage)

    const rulesResults = ref<ResourceResults<SearchRule[]> | null>(null)
    const rules = ref<SearchRule[]>([])
    const currentRule = ref<SearchRule | null>(null)
    const isFetching = ref(false)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const searchQuery = ref('')
    const activeFilter = ref<boolean | null>(null)

    const rulesQuery = computed<SearchRuleListPayload>(() => {
        const filter: SearchRuleListFilterPayload = {}
        if (searchQuery.value.trim()) {
            filter.attributePatterns = [`*${searchQuery.value.trim()}*`]
        }
        if (activeFilter.value !== null) {
            filter.active = activeFilter.value
        }
        return {
            limit: perPage.value,
            offset: offset.value,
            filter: Object.keys(filter).length > 0 ? filter : null,
        }
    })

    async function fetchRules(params?: SearchRuleListPayload): Promise<ResourceResults<SearchRule[]> | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const results = await client.getDynamicSearchRules(params)
            rulesResults.value = results
            rules.value = results.results
            return results
        } catch (err) {
            rulesResults.value = null
            rules.value = []
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function fetchRulesPaginated(resetPagination: boolean = false): Promise<ResourceResults<SearchRule[]> | undefined> {
        if (resetPagination) {
            currentPage.value = 1
        }

        const results = await fetchRules(rulesQuery.value)
        if (!results) {
            return results
        }

        if (syncCurrentPageWithinTotal(results.total)) {
            return fetchRules(rulesQuery.value)
        }

        return results
    }

    async function fetchRule(uid: string): Promise<SearchRule | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isFetching.value = true
        error.value = null

        try {
            const result = await client.getDynamicSearchRule(uid)
            currentRule.value = result
            return result
        } catch (err) {
            currentRule.value = null
            error.value = (err as Error).message
        } finally {
            isFetching.value = false
        }
    }

    async function createOrUpdate(
        uid: string,
        payload: SearchRuleUpdatePayload
    ): Promise<SearchRule | undefined> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const result = await client.updateDynamicSearchRule(uid, payload)
            toast.add({
                color: 'success',
                icon: 'i-lucide-circle-check',
                title: 'Rule Saved',
                description: `Search rule "${uid}" was saved successfully`,
                duration: 3000,
            })
            return result
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function deleteRule(uid: string): Promise<void> {
        const client = meilisearchStore.getClient()
        if (!client) {
            error.value = 'Meilisearch client not connected'
            return
        }

        isLoading.value = true
        error.value = null

        try {
            await client.deleteDynamicSearchRule(uid)
        } catch (err) {
            error.value = (err as Error).message
            throw err
        } finally {
            isLoading.value = false
        }
    }

    function confirmDeleteRule(
        uid: string,
        onDeletedCallback?: () => void
    ) {
        void confirmAction({
            title: 'Danger Zone',
            description: 'Are you sure you want to delete this search rule?',
            confirmLabel: 'Delete',
        }, async () => {
            await deleteRule(uid).then(() => {
                onDeletedCallback?.()
            })
        })
    }

    watch(error, (newError) => {
        if (newError) {
            toast.add({
                color: 'error',
                icon: 'i-lucide-circle-x',
                title: 'Meilisearch Search Rules Error',
                description: newError,
                duration: 7500,
            })
        }
    })

    return {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        rules,
        rulesResults,
        currentRule,
        isFetching,
        isLoading,
        error,
        searchQuery,
        activeFilter,
        handlePageEvent,
        fetchRules,
        fetchRulesPaginated,
        fetchRule,
        createOrUpdate,
        deleteRule,
        confirmDeleteRule,
    }
}
