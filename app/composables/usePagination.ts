export interface PaginationOptions {
    total?: () => number | null | undefined;
    itemLabel?: string;
}

export function usePagination(initialPerPage: number = 20, options: PaginationOptions = {}) {
    const currentPage = ref(1)
    const perPage = ref(initialPerPage)
    const totalRecords = computed(() => options.total?.() ?? 0)
    const itemLabel = options.itemLabel ?? 'records'

    const offset = computed(() => (perPage.value * currentPage.value) - perPage.value)
    const rangeStart = computed(() => totalRecords.value === 0 ? 0 : offset.value + 1)
    const rangeEnd = computed(() => Math.min(currentPage.value * perPage.value, totalRecords.value))
    const resultText = computed(() => {
        return `Showing ${rangeStart.value} to ${rangeEnd.value} of ${totalRecords.value} ${itemLabel}`
    })

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
            const appScrollContainer = document.querySelector<HTMLElement>('.app-scroll-container')
            if (appScrollContainer) {
                appScrollContainer.scrollTo({ top: 0 })
            } else {
                window.scrollTo({ top: 0 })
            }
        }
    }

    return {
        currentPage,
        perPage,
        totalRecords,
        offset,
        rangeStart,
        rangeEnd,
        resultText,
        syncCurrentPageWithinTotal,
        paginate,
    }
}
