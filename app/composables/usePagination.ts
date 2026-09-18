export interface PaginationEvent {
    page: number;
    rows: number;
}

export function usePagination(initialPerPage: number = 20) {
    const currentPage = ref(1)
    const perPage = ref(initialPerPage)

    const firstDatasetIndex = computed(() => {
        return (currentPage.value - 1) * perPage.value
    })
    const offset = computed(() => (perPage.value * currentPage.value) - perPage.value)

    function syncCurrentPageWithinTotal(totalRecords?: number | null): boolean {
        if (totalRecords === null || totalRecords === undefined) {
            return false
        }

        const lastPage = Math.max(1, Math.ceil(totalRecords / perPage.value))
        if (currentPage.value > lastPage) {
            currentPage.value = lastPage
            return true
        }

        return false
    }

    async function paginate<T>(
        page: number,
        pageSize: number,
        onPaginatedCallback?: () => Promise<T>,
        scrollTop: boolean = true,
        scrollTopContainerId?: string,
    ): Promise<void> {
        if (pageSize !== perPage.value) {
            currentPage.value = 1
        } else {
            currentPage.value = page
        }
        perPage.value = pageSize

        await onPaginatedCallback?.()
        if (scrollTop && scrollTopContainerId) {
            const scrollTopContainer = document.getElementById(scrollTopContainerId)
            if (scrollTopContainer) {
                scrollTopContainer.scrollTop = 0
            }
        } else if (scrollTop) {
            window.scrollTo({ top: 0 })
        }
    }

    function handlePageEvent<T>(
        event: PaginationEvent,
        onPaginatedCallback?: () => Promise<T>,
        scrollTop: boolean = true,
        scrollTopContainerId?: string,
    ): Promise<void> {
        return paginate(event.page + 1, event.rows, onPaginatedCallback, scrollTop, scrollTopContainerId)
    }

    return {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        syncCurrentPageWithinTotal,
        paginate,
        handlePageEvent,
    }
}
