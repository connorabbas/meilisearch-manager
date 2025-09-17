import { computed, ref } from 'vue';
import { DataTablePageEvent, PageState } from 'primevue';

export function usePagination(initialPerPage: number = 20) {
    const currentPage = ref(1);
    const perPage = ref(initialPerPage);

    const firstDatasetIndex = computed(() => {
        return (currentPage.value - 1) * perPage.value;
    });
    const offset = computed(() => (perPage.value * currentPage.value) - perPage.value);

    function handlePageEvent<T>(
        event: PageState | DataTablePageEvent,
        onPaginatedCallback?: () => Promise<T>,
        scrollTop: boolean = true,
        scrollTopContainerId?: string,
    ): Promise<void> | undefined {
        if (event.rows !== perPage.value) {
            currentPage.value = 1;
        } else {
            currentPage.value = event.page + 1;
        }
        perPage.value = event.rows;

        return onPaginatedCallback?.().then(() => {
            if (scrollTop && scrollTopContainerId) {
                const scrollTopContainer = document.getElementById(scrollTopContainerId);
                if (scrollTopContainer) {
                    scrollTopContainer.scrollTop = 0;
                }
            } else if (scrollTop) {
                window.scrollTo({ top: 0 });
            }
        });
    }

    return {
        currentPage,
        perPage,
        firstDatasetIndex,
        offset,
        handlePageEvent,
    };
}